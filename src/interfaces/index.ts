export interface IQuery {
  searchTerm?: string;
  sortBy?: string;
  limit?: string;
  page?: string;
  sortOrder?: "asc" | "desc";
}
