// 9. Send Bot Message Endpoint
app.all('/api/v1/bot/send', authenticateApiKey, async (req: any, res: any) => {
  try {
    let { recipient, text, metadata } = { ...req.query, ...req.body };
    if (!recipient || !text) return res.status(400).json({ error: 'Missing recipient or text' });

    const resolvedUser = await resolveUserRecipient(recipient);
    const cleanRecipient = resolvedUser.username;
    
    const { owner, owner_username, bot_username, app_name } = req.appData;
    const devOwner = owner || owner_username || 'developer';
    const businessSender = (bot_username || `sa_${devOwner}`).toLowerCase().replace(/^@/, '');
    
    const delivery = await deliverBotChatMessage({
      senderBotUsername: businessSender,
      senderAppName: app_name || 'Zenoa Service Bot',
      recipientUsername: cleanRecipient,
      recipientZenoaId: resolvedUser.zenoaId,
      messageText: text,
      metadata
    });
    
    await recordDeveloperLog(req.appData.id, {
      action: 'bot_message_sent',
      recipient: cleanRecipient,
      timestamp: Date.now()
    });

    res.json({ success: true, message: 'Message sent', ...delivery });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
