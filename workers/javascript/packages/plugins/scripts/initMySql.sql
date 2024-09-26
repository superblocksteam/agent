DROP DATABASE IF EXISTS public;

CREATE DATABASE public;

USE public;

DROP TABLE IF EXISTS mytable;
DROP TABLE IF EXISTS commacolumntable;
DROP TABLE IF EXISTS mytable_nopk;
DROP TABLE IF EXISTS MixedCaseTable;

CREATE TABLE mytable (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  age INT
);

INSERT INTO mytable (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable (name, age) VALUES ('Joey Antonio', 26);
INSERT INTO mytable (name, age) VALUES ('Domi James', 19);

CREATE TABLE commacolumntable (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `column,name` VARCHAR(255)
);

INSERT INTO commacolumntable (`column,name`) VALUES ('foo');
INSERT INTO commacolumntable (`column,name`) VALUES ('baz');
INSERT INTO commacolumntable (`column,name`) VALUES ('bar');

-- same as mytable but without a primary key
CREATE TABLE mytable_nopk (
  name VARCHAR(100),
  age INT
);

INSERT INTO mytable_nopk (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable_nopk (name, age) VALUES ('Joey Antonio', 26);
INSERT INTO mytable_nopk (name, age) VALUES ('Domi James', 19);

CREATE TABLE MixedCaseTable (
  MixedPk SERIAL PRIMARY KEY,
  MixedName TEXT,
  ALLUPPER BOOLEAN,
  age INTEGER
);

INSERT INTO MixedCaseTable (MixedName, ALLUPPER, age) VALUES ('Frank Basil', 0, 29);
INSERT INTO MixedCaseTable (MixedName, ALLUPPER, age) VALUES ('Joey Antonio', 1, 26);
