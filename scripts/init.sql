-- init.sql

CREATE TABLE mytable (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  age INTEGER
);

INSERT INTO mytable (name, age) VALUES ('Frank Basil', 29);
INSERT INTO mytable (name, age) VALUES ('Joey Antonio', 26);
