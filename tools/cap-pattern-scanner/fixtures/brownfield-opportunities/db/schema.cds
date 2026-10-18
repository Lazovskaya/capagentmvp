entity Items {
  key ID        : UUID;
  code          : String(20);
  name          : String(100);
  stock         : Integer;
  createdAt     : Timestamp;
  modifiedAt    : Timestamp;
}
