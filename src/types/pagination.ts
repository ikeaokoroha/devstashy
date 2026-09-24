// One page of a list, plus the size of the whole list. The queries return the
// total alongside the rows so the page headers keep showing the real count and
// the controls know how many pages there are, without loading every row.
export interface Paginated<T> {
  rows: T[];
  total: number;
}
