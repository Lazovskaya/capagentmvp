using { cuid, managed } from '@sap/cds/common';

entity Items : cuid, managed {
  code  : String(20) @mandatory;
  name  : String(100) @mandatory;
  stock : Integer default 0;
}
