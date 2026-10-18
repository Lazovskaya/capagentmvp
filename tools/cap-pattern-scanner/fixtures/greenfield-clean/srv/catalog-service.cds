using { Items as DbItems } from '../db/schema';

service CatalogService {
  @odata.draft.enabled
  entity Items as projection on DbItems;

  action searchItems(term : String) returns many Items;
}
