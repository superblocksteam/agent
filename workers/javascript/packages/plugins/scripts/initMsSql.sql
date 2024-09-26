BEGIN TRANSACTION;

IF OBJECT_ID('dbo.mytable', 'U') IS NOT NULL
    DROP TABLE mytable;
IF OBJECT_ID('dbo.commacolumntable', 'U') IS NOT NULL
    DROP TABLE commacolumntable;
IF OBJECT_ID('dbo.mytable_nopk', 'U') IS NOT NULL
    DROP TABLE mytable_nopk;
IF OBJECT_ID('dbo.MixedCaseTable', 'U') IS NOT NULL
    DROP TABLE "MixedCaseTable";

CREATE TABLE mytable (
  id INT PRIMARY KEY IDENTITY(1,1),
  name NVARCHAR(MAX),
  age INT
);

INSERT INTO mytable (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable (name, age) VALUES ('Joey Antonio', 26);
INSERT INTO mytable (name, age) VALUES ('Domi James', 19);

CREATE TABLE commacolumntable (
    id INT PRIMARY KEY IDENTITY(1,1),
    [column,name] NVARCHAR(MAX)
);

INSERT INTO commacolumntable ([column,name]) VALUES ('foo');
INSERT INTO commacolumntable ([column,name]) VALUES ('baz');
INSERT INTO commacolumntable ([column,name]) VALUES ('bar');

CREATE TABLE mytable_nopk (
    name NVARCHAR(MAX),
    age INT
);

INSERT INTO mytable_nopk (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable_nopk (name, age) VALUES ('Joey Antonio', 26);
INSERT INTO mytable_nopk (name, age) VALUES ('Domi James', 19);

CREATE TABLE "MixedCaseTable" (
  "MixedPk" INT PRIMARY KEY IDENTITY(1,1),
  "MixedName" NVARCHAR(MAX),
  "ALLUPPER" BIT,
  age INT
);

INSERT INTO "MixedCaseTable" ("MixedName", "ALLUPPER", age) VALUES ('Frank Basil', 0, 29);
INSERT INTO "MixedCaseTable" ("MixedName", "ALLUPPER", age) VALUES ('Joey Antonio', 1, 26);

COMMIT;
