CREATE USER IF NOT EXISTS 'raven_web_user'@'%'
  IDENTIFIED BY 'raven_web_test_password';

CREATE USER IF NOT EXISTS 'trust_user'@'%'
  IDENTIFIED BY 'trust_test_password';

CREATE USER IF NOT EXISTS 'weather_user'@'%'
  IDENTIFIED BY 'weather_test_password';

REVOKE ALL PRIVILEGES, GRANT OPTION
  FROM 'raven_web_user'@'%';

REVOKE ALL PRIVILEGES, GRANT OPTION
  FROM 'trust_user'@'%';

REVOKE ALL PRIVILEGES, GRANT OPTION
  FROM 'weather_user'@'%';

GRANT ALL PRIVILEGES
  ON m2oath_web.*
  TO 'raven_web_user'@'%';

GRANT ALL PRIVILEGES
  ON m2oath_trust.*
  TO 'trust_user'@'%';

GRANT ALL PRIVILEGES
  ON m2oath_weather.*
  TO 'weather_user'@'%';
