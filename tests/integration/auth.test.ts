import { describe, test, expect, beforeEach, vi } from "vitest";
import app from "../../src/app";
import httpMocks from "node-mocks-http";
import request from "supertest";
import httpStatus from "http-status";
import config from "../../src/config/config";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import authorize from "../../src/middlewares/auth.middleware";
import { emailService, tokenService } from "../../src/services";
import { Role, TokenType } from "@prisma/client";
import { userOne, insertUsers } from "../fixtures/user.fixture";
import { ROLE_PRIVILEGES } from "../../src/constants/role.constants";
import {
  userOneAccessToken,
  adminAccessToken
} from "../fixtures/token.fixture";
import { SentMessageInfo } from "nodemailer";
import ApiError from "../../src/utils/ApiError";
import prisma from "../../src/lib/prisma";
import bcrypt from "bcrypt";

describe("Auth routes", async () => {
  describe("POST /v1/auth/register", async () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        username: faker.internet.username().toLowerCase(),
        email: faker.internet.email().toLowerCase(),
        password: "password1"
      };
    });

    test("should return 201 and successfully register user if request data is ok", async () => {
      const res = await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty("password");

      expect(res.body.user).toEqual({
        id: expect.anything(),
        username: newUser.username,
        email: newUser.email,
        role: Role.USER,
        isEmailVerified: false
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: res.body.user.id }
      });

      expect(dbUser).toBeDefined();

      expect(dbUser).toMatchObject({
        id: expect.anything(),
        username: newUser.username,
        email: newUser.email,
        role: Role.USER,
        isEmailVerified: false
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() }
      });
    });

    test("should return 400 error if email is invalid", async () => {
      newUser.email = "invalidEmail";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if email is already used", async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password length is less than 8 characters", async () => {
      newUser.password = "passwo1";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 400 error if password does not contain both letters and numbers", async () => {
      newUser.password = "password";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = "11111111";

      await request(app)
        .post("/v1/auth/register")
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/login", () => {
    test("should return 200 and login user if username and password match", async () => {
      await insertUsers([userOne]);

      const loginCredentials = {
        username: userOne.username,
        password: userOne.password
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.OK);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        username: userOne.username,
        email: userOne.email,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() }
      });
    });

    test("should return 401 error if there are no users with that username", async () => {
      const loginCredentials = {
        username: userOne.username,
        password: userOne.password
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        code: httpStatus.UNAUTHORIZED,
        message: "Incorrect username or password"
      });
    });

    test("should return 401 error if password is wrong", async () => {
      await insertUsers([userOne]);

      const loginCredentials = {
        username: userOne.username,
        password: "wrongPassword1"
      };

      const res = await request(app)
        .post("/v1/auth/login")
        .send(loginCredentials)
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        code: httpStatus.UNAUTHORIZED,
        message: "Incorrect username or password"
      });
    });
  });

  describe("POST /v1/auth/logout", () => {
    test("should return 204 if refresh token is valid", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await tokenService.saveToken(
        refreshToken,
        userOne.id,
        TokenType.REFRESH,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await prisma.token.findUnique({
        where: { token: refreshToken }
      });

      expect(dbRefreshTokenDoc).toBe(null);
    });

    test("should return 400 error if refresh token is missing from request body", async () => {
      await request(app)
        .post("/v1/auth/logout")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if refresh token is not found in the database", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 404 error if refresh token is revoked", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await tokenService.saveToken(
        refreshToken,
        userOne.id,
        TokenType.REFRESH,
        expires.toDate(),
        true
      );

      await request(app)
        .post("/v1/auth/logout")
        .send({ refreshToken })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("POST /v1/auth/refresh-tokens", () => {
    test("should return 200 and new auth tokens if refresh token is valid", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await tokenService.saveToken(
        refreshToken,
        userOne.id,
        TokenType.REFRESH,
        expires.toDate()
      );

      const res = await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() }
      });

      const dbRefreshTokenDoc = await prisma.token.findUnique({
        where: { token: res.body.refresh.token }
      });

      expect(dbRefreshTokenDoc).toMatchObject({
        type: TokenType.REFRESH,
        userId: userOne.id,
        revoked: false
      });

      const dbRefreshTokenCount = await prisma.user.count();

      expect(dbRefreshTokenCount).toBe(1);
    });

    test("should return 400 error if refresh token is missing from request body", async () => {
      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 error if refresh token is signed using an invalid secret", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix(),
        "invalidsecret"
      );

      await tokenService.saveToken(
        refreshToken,
        userOne.id,
        TokenType.REFRESH,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is not found in the database", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is revoked", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.refreshExpirationDays as number,
        "days"
      );

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await tokenService.saveToken(
        refreshToken,
        userOne.id,
        TokenType.REFRESH,
        expires.toDate(),
        true
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 error if refresh token is expired", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().subtract(1, "minutes");

      const refreshToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.REFRESH,
        expires.unix()
      );

      await tokenService.saveToken(
        refreshToken,
        userOne.id,
        TokenType.REFRESH,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/refresh-tokens")
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/auth/forgot-password", () => {
    beforeEach(() => {
      vi.spyOn(emailService.transport, "sendMail").mockResolvedValue(
        {} as SentMessageInfo
      );
    });

    test("should return 204 and send reset password email to the user", async () => {
      await insertUsers([userOne]);

      const sendResetPasswordEmailSpy = vi.spyOn(
        emailService,
        "sendResetPasswordEmail"
      );

      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(
        userOne.email,
        expect.any(String)
      );

      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];

      const dbResetPasswordTokenDoc = await prisma.token.findFirst({
        where: { token: resetPasswordToken, userId: userOne.id }
      });

      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    test("should return 400 if email is missing", async () => {
      await insertUsers([userOne]);
      await request(app)
        .post("/v1/auth/forgot-password")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 if email does not belong to any user", async () => {
      await request(app)
        .post("/v1/auth/forgot-password")
        .send({ email: userOne.email })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("POST /v1/auth/reset-password", () => {
    test("should return 204 and reset the password", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.resetPasswordExpirationMinutes as number,
        "minutes"
      );

      const resetPasswordToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.RESET_PASSWORD,
        expires.unix()
      );

      await tokenService.saveToken(
        resetPasswordToken,
        userOne.id,
        TokenType.RESET_PASSWORD,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password2" })
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await prisma.user.findUnique({
        where: { id: userOne.id },
        omit: { password: false }
      });

      const isPasswordMatch = await bcrypt.compare(
        "password2",
        dbUser?.password as string
      );

      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await prisma.token.count({
        where: {
          userId: userOne.id,
          type: TokenType.RESET_PASSWORD
        }
      });

      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test("should return 400 if reset password token is missing", async () => {
      await request(app)
        .post("/v1/auth/reset-password")
        .send({ password: "password2" })
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 if reset password token is revoked", async () => {
      await insertUsers([userOne]);
      const expires = dayjs().add(
        config.jwt.resetPasswordExpirationMinutes as number,
        "minutes"
      );
      const resetPasswordToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.RESET_PASSWORD,
        expires.unix()
      );

      await tokenService.saveToken(
        resetPasswordToken,
        userOne.id,
        TokenType.RESET_PASSWORD,
        expires.toDate(),
        true
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password2" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if reset password token is expired", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().subtract(1, "minutes");

      const resetPasswordToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.RESET_PASSWORD,
        expires.unix()
      );

      await tokenService.saveToken(
        resetPasswordToken,
        userOne.id,
        TokenType.RESET_PASSWORD,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password2" })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 400 if password is missing or invalid", async () => {
      await insertUsers([userOne]);
      const expires = dayjs().add(
        config.jwt.resetPasswordExpirationMinutes as number,
        "minutes"
      );
      const resetPasswordToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.RESET_PASSWORD,
        expires.unix()
      );

      await tokenService.saveToken(
        resetPasswordToken,
        userOne.id,
        TokenType.RESET_PASSWORD,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "short1" })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "password" })
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post("/v1/auth/reset-password")
        .query({ token: resetPasswordToken })
        .send({ password: "11111111" })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("POST /v1/auth/send-verification-email", () => {
    beforeEach(() => {
      vi.spyOn(emailService.transport, "sendMail").mockResolvedValue(
        {} as SentMessageInfo
      );
    });

    test("should return 204 and send verification email to the user", async () => {
      await insertUsers([userOne]);

      const sendVerificationEmailSpy = vi.spyOn(
        emailService,
        "sendVerificationEmail"
      );

      await request(app)
        .post("/v1/auth/send-verification-email")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
        userOne.email,
        expect.any(String)
      );

      const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];

      const dbVerifyEmailToken = await prisma.token.findFirst({
        where: { token: verifyEmailToken, userId: userOne.id }
      });

      expect(dbVerifyEmailToken).toBeDefined();
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([userOne]);
      await request(app)
        .post("/v1/auth/send-verification-email")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /v1/auth/verify-email", () => {
    test("should return 204 and verify the email", async () => {
      await insertUsers([userOne]);
      const expires = dayjs().add(
        config.jwt.verifyEmailExpirationMinutes as number,
        "minutes"
      );
      const verifyEmailToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.VERIFY_EMAIL,
        expires.unix()
      );

      await tokenService.saveToken(
        verifyEmailToken,
        userOne.id,
        TokenType.VERIFY_EMAIL,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await prisma.user.findUnique({
        where: { id: userOne.id }
      });

      expect(dbUser?.isEmailVerified).toBe(true);

      const dbVerifyEmailToken = await prisma.token.count({
        where: { userId: userOne.id, type: TokenType.VERIFY_EMAIL }
      });

      expect(dbVerifyEmailToken).toBe(0);
    });

    test("should return 400 if verify email token is missing", async () => {
      await insertUsers([userOne]);
      await request(app)
        .post("/v1/auth/verify-email")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 401 if verify email token is revoked", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().add(
        config.jwt.verifyEmailExpirationMinutes as number,
        "days"
      );

      const verifyEmailToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.VERIFY_EMAIL,
        expires.unix()
      );

      await tokenService.saveToken(
        verifyEmailToken,
        userOne.id,
        TokenType.VERIFY_EMAIL,
        expires.toDate(),
        true
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 401 if verify email token is expired", async () => {
      await insertUsers([userOne]);

      const expires = dayjs().subtract(1, "minutes");

      const verifyEmailToken = tokenService.generateToken(
        userOne.id,
        userOne.role,
        TokenType.VERIFY_EMAIL,
        expires.unix()
      );

      await tokenService.saveToken(
        verifyEmailToken,
        userOne.id,
        TokenType.VERIFY_EMAIL,
        expires.toDate()
      );

      await request(app)
        .post("/v1/auth/verify-email")
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});

describe("Auth middleware", () => {
  test("should call next with no errors if access token is valid", async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` }
    });

    const next = vi.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalled();
    expect(req.auth?.payload.sub).toEqual(userOne.id);
  });

  test("should call next with unauthorized error if access token is not found in header", async () => {
    const req = httpMocks.createRequest();
    const next = vi.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Invalid token"
      })
    );
  });

  test("should call next with unauthorized error if access token is not a valid jwt token", async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: "Bearer randomToken" }
    });
    const next = vi.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Invalid token"
      })
    );
  });

  test("should call next with unauthorized error if the token is not an access token", async () => {
    const expires = dayjs().add(
      config.jwt.accessExpirationMinutes as number,
      "minutes"
    );
    const refreshToken = tokenService.generateToken(
      userOne.id,
      userOne.role,
      TokenType.REFRESH,
      expires.unix()
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    const next = vi.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Invalid token"
      })
    );
  });

  test("should call next with unauthorized error if access token is generated with an invalid secret", async () => {
    const expires = dayjs().add(
      config.jwt.accessExpirationMinutes as number,
      "minutes"
    );
    const accessToken = tokenService.generateToken(
      userOne.id,
      userOne.role,
      TokenType.ACCESS,
      expires.unix(),
      "invalidSecret"
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const next = vi.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Invalid token"
      })
    );
  });

  test("should call next with unauthorized error if access token is expired", async () => {
    const expires = dayjs().subtract(1, "minutes");
    const accessToken = tokenService.generateToken(
      userOne.id,
      userOne.role,
      TokenType.ACCESS,
      expires.unix(),
      "invalidSecret"
    );
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const next = vi.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Invalid token"
      })
    );
  });

  test("should call next with forbidden error if user does not have required rights and userId is not in params", async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` }
    });
    const next = vi.fn();

    await authorize("action:resource")(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
        message: "Forbidden"
      })
    );
  });

  test("should call next with no errors if user does not have required rights but userId is in params", async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { userId: userOne.id }
    });
    const next = vi.fn();

    await authorize("anyRight")(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test("should call next with no errors if user has required rights", async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      params: { userId: userOne.id }
    });
    const next = vi.fn();

    await authorize(...(ROLE_PRIVILEGES.get(Role.ADMIN) as string[]))(
      req,
      httpMocks.createResponse(),
      next
    );

    expect(next).toHaveBeenCalledWith();
  });
});
