using { cuid, managed } from '@sap/cds/common';

entity Notes : cuid, managed {
  text : String(500);
}
