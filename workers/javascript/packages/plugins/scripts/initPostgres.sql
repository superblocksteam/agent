BEGIN;

DROP TABLE IF EXISTS mytable;
DROP TABLE IF EXISTS commacolumntable;
DROP TABLE IF EXISTS mytable_nopk;
DROP TABLE IF EXISTS "MixedCaseTable";

CREATE TABLE mytable (
  id SERIAL PRIMARY KEY,
  name TEXT,
  age INTEGER
);

INSERT INTO mytable (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable (name, age) VALUES ('Joey Antonio', 26);
INSERT INTO mytable (name, age) VALUES ('Domi James', 19);

CREATE TABLE commacolumntable (
    id SERIAL PRIMARY KEY,
    "column,name" TEXT
);

INSERT INTO commacolumntable ("column,name") VALUES ('foo');
INSERT INTO commacolumntable ("column,name") VALUES ('baz');
INSERT INTO commacolumntable ("column,name") VALUES ('bar');

-- same as mytable but without a primary key
CREATE TABLE mytable_nopk (
    name TEXT,
    age INTEGER
);

INSERT INTO mytable_nopk (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable_nopk (name, age) VALUES ('Joey Antonio', 26);
INSERT INTO mytable_nopk (name, age) VALUES ('Domi James', 19);

CREATE TABLE "MixedCaseTable" (
  "MixedPk" SERIAL PRIMARY KEY,
  "MixedName" TEXT,
  "ALLUPPER" BOOLEAN,
  age INTEGER
);

INSERT INTO "MixedCaseTable" ("MixedName", "ALLUPPER", age) VALUES ('Frank Basil', FALSE, 29);
INSERT INTO "MixedCaseTable" ("MixedName", "ALLUPPER", age) VALUES ('Joey Antonio', TRUE, 26);

COMMIT;
