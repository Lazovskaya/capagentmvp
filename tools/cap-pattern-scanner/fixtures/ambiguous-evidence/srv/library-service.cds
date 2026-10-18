using { Books as DbBooks } from '../db/schema';

service LibraryService {
  entity Books as projection on DbBooks;
  action byAuthor(name : String) returns many Books;
  action lend(copies : Integer) returns Boolean;
}
