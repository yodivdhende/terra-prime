ALTER TABLE `Expertise` DROP COLUMN `Cost`;

CREATE TABLE `Expertise_Point_Costs` (
  `Point` tinyint NOT NULL,
  `Cost`  int     NOT NULL DEFAULT 0,
  PRIMARY KEY (`Point`),
  CONSTRAINT `epc_point_range` CHECK (`Point` BETWEEN 1 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Expertise_Point_Costs` (`Point`, `Cost`) VALUES
  (1,10),(2,10),(3,10),(4,10),(5,10),(6,10),(7,10),(8,10),(9,10),(10,10),
  (11,10),(12,10),(13,10),(14,10),(15,10),(16,10),(17,10),(18,10),(19,10),(20,10);
