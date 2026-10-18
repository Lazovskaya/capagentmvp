using { Notes as DbNotes } from '../db/schema';

service NotesService {
  entity Notes as projection on DbNotes;
}
