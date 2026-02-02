const { createClient } = require('@libsql/client')

async function migrate() {
  const client = createClient({
    url: 'file:./prisma/dev.db'
  })

  console.log('Running community points migration...')

  try {
    // Add points column if it doesn't exist
    try {
      await client.execute('ALTER TABLE User ADD COLUMN points INTEGER DEFAULT 0')
      console.log('Added points column to User table')
    } catch (e) {
      if (e.message.includes('duplicate')) {
        console.log('points column already exists')
      } else {
        console.log('Note:', e.message)
      }
    }

    // Add showOnLeaderboard column if it doesn't exist
    try {
      await client.execute('ALTER TABLE User ADD COLUMN showOnLeaderboard INTEGER DEFAULT 1')
      console.log('Added showOnLeaderboard column to User table')
    } catch (e) {
      if (e.message.includes('duplicate')) {
        console.log('showOnLeaderboard column already exists')
      } else {
        console.log('Note:', e.message)
      }
    }

    // Create CommunityPoint table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS CommunityPoint (
        id TEXT PRIMARY KEY,
        recipientId TEXT NOT NULL,
        giverId TEXT NOT NULL,
        discussionId TEXT,
        replyId TEXT,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipientId) REFERENCES User(id),
        FOREIGN KEY (giverId) REFERENCES User(id),
        FOREIGN KEY (discussionId) REFERENCES Discussion(id),
        FOREIGN KEY (replyId) REFERENCES DiscussionReply(id)
      )
    `)
    console.log('Created CommunityPoint table')

    // Create indexes
    await client.execute('CREATE INDEX IF NOT EXISTS CommunityPoint_recipientId_idx ON CommunityPoint(recipientId)')
    await client.execute('CREATE INDEX IF NOT EXISTS CommunityPoint_giverId_idx ON CommunityPoint(giverId)')
    await client.execute('CREATE INDEX IF NOT EXISTS CommunityPoint_discussionId_idx ON CommunityPoint(discussionId)')
    await client.execute('CREATE INDEX IF NOT EXISTS CommunityPoint_replyId_idx ON CommunityPoint(replyId)')
    console.log('Created indexes')

    // Create unique constraints - use partial indexes for nullable columns
    try {
      await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS CommunityPoint_giverId_discussionId_key ON CommunityPoint(giverId, discussionId) WHERE discussionId IS NOT NULL')
      console.log('Created unique index on giverId, discussionId')
    } catch (e) {
      console.log('Note:', e.message)
    }

    try {
      await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS CommunityPoint_giverId_replyId_key ON CommunityPoint(giverId, replyId) WHERE replyId IS NOT NULL')
      console.log('Created unique index on giverId, replyId')
    } catch (e) {
      console.log('Note:', e.message)
    }

    console.log('Migration completed successfully!')
  } catch (e) {
    console.error('Migration error:', e)
    process.exit(1)
  }
}

migrate()
