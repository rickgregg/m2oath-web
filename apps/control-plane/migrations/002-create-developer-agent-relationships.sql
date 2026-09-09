CREATE TABLE IF NOT EXISTS developer_agent_relationships (
  developer_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  relationship ENUM('owner') NOT NULL,
  created_at DATETIME(3) NOT NULL,

  PRIMARY KEY (
    developer_id,
    agent_id,
    relationship
  ),

  CONSTRAINT fk_developer_agent_relationships_developer
    FOREIGN KEY (developer_id)
    REFERENCES developer_accounts (developer_id),

  INDEX idx_developer_agent_relationships_agent (
    agent_id
  )
);
