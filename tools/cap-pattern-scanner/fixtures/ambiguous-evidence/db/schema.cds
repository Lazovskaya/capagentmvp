using { cuid } from '@sap/cds/common';

entity Authors : cuid {
  name : String(100);
}

entity Books : cuid {
  title  : String(100);
  author : Association to Authors;
  copies : Integer;
}
