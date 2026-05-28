DROP TABLE IF EXISTS Event_Character_Discounts_Items;
DROP TABLE IF EXISTS Event_Character_Discounts_Implants;
DROP TABLE IF EXISTS Event_Character_Discounts_Skills;

CREATE TABLE Event_Character_Budget (
  Event     INT NOT NULL,
  Character INT NOT NULL,
  Budget    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (Event, Character),
  FOREIGN KEY (Event)     REFERENCES Events(Id),
  FOREIGN KEY (Character) REFERENCES Characters(Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
