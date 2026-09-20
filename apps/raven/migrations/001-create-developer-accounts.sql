CREATE TABLE IF NOT EXISTS developer_accounts (
  developer_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NULL,
  status ENUM('active', 'disabled') NOT NULL,
  role ENUM('developer', 'admin') NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,

  PRIMARY KEY (developer_id)
);

CREATE TABLE IF NOT EXISTS developer_identity_bindings (
  developer_id VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL,

  PRIMARY KEY (developer_id, issuer, subject),

  CONSTRAINT fk_developer_identity_bindings_account
    FOREIGN KEY (developer_id)
    REFERENCES developer_accounts (developer_id),

  CONSTRAINT uq_developer_identity_bindings_external_identity
    UNIQUE (issuer, subject)
);
