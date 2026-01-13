/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Prisma } from "@prisma/client";

export type PaginationQuery<T> = Prisma.Args<T, "findMany">["where"];

export type PaginationArgs<T> = {
  page?: number;
  limit?: number;
  order?: string;
  where?: PaginationQuery<T>;
};

export type PaginationResult<T> = {
  results: T[];
  meta: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
  };
};

export const paginateExtension = Prisma.defineExtension({
  name: "paginateExtension",
  model: {
    $allModels: {
      async paginate<T>(
        this: T,
        args: PaginationArgs<T> = {} as PaginationArgs<T>
      ) {
        const context = Prisma.getExtensionContext(this);

        const {
          page = 1,
          limit = 10,
          order = "id:asc",
          where = {} as PaginationQuery<T>
        } = args;

        const take = Math.max(1, limit);
        const skip = Math.max(0, (page - 1) * limit);

        const orderBy = order?.split(",").map((sortOption) => {
          const [key, value] = sortOption.split(":");
          return { [key]: value == "asc" ? "asc" : "desc" };
        });

        const [results, totalResults] = await Promise.all([
          (context as any).findMany({
            skip,
            take,
            orderBy,
            where
          }),
          (context as any).count({ where })
        ]);

        return {
          results,
          meta: {
            page,
            limit,
            totalResults,
            totalPages: Math.ceil(totalResults / limit)
          }
        };
      }
    }
  }
});

export default paginateExtension;
