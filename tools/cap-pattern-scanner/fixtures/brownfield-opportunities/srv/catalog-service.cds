using { Items as DbItems } from '../db/schema';

service CatalogService {
  entity Items as projection on DbItems;
  action searchItems(term : String) returns many Items;
  action syncStock() returns Boolean;
}
