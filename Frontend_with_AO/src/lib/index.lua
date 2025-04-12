-- Initialize state for transactions
if not transactions then
  transactions = {}
end

-- Handler for getting all transactions
Handlers.add(
  'GetTransactions',
  { Action = 'GetTransactions' },
  function(msg)
    -- Sample transaction data with the specified tag format
    if #transactions == 0 then
      table.insert(transactions, {
        id = 'tx_' .. os.time(),
        timestamp = os.date('%Y-%m-%dT%H:%M:%SZ'),
        status = 'confirmed',
        data = 'Sample image data',
        tags = {
          { name = 'Content-Type', value = 'image/jpeg' },
          { name = 'Device', value = 'Buildathon-ESP32-CAM_v3' }
        }
      })
    end
    
    ao.send({
      Target = msg.From,
      Data = json.encode(transactions)
    })
  end
)

-- Handler for adding new transactions
Handlers.add(
  'AddTransaction',
  { Action = 'AddTransaction' },
  function(msg)
    if not msg.Tags.id or not msg.Tags.data then
      ao.send({
        Target = msg.From,
        Data = json.encode({ error = 'Missing required fields' })
      })
      return
    end
    
    local newTx = {
      id = msg.Tags.id,
      timestamp = os.date('%Y-%m-%dT%H:%M:%SZ'),
      status = 'pending',
      data = msg.Tags.data,
      tags = {}
    }
    
    -- Add any custom tags
    for k, v in pairs(msg.Tags) do
      if k ~= 'Action' and k ~= 'id' and k ~= 'data' then
        table.insert(newTx.tags, { name = k, value = v })
      end
    end
    
    table.insert(transactions, newTx)
    
    ao.send({
      Target = msg.From,
      Data = json.encode({ success = true, id = msg.Tags.id })
    })
  end
)

-- Handler for updating transaction status
Handlers.add(
  'UpdateStatus',
  { Action = 'UpdateStatus' },
  function(msg)
    if not msg.Tags.id or not msg.Tags.status then
      ao.send({
        Target = msg.From,
        Data = json.encode({ error = 'Missing required fields' })
      })
      return
    end
    
    for _, tx in ipairs(transactions) do
      if tx.id == msg.Tags.id then
        tx.status = msg.Tags.status
        break
      end
    end
    
    ao.send({
      Target = msg.From,
      Data = json.encode({ success = true })
    })
  end
)