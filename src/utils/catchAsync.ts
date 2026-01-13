import { Request, Response, NextFunction } from "express";

type callBack = (req: Request, res: Response, next: NextFunction) => void;

const catchAsync =
  (fn: callBack) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

export default catchAsync;
