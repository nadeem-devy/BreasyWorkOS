-- Enable realtime for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_events;
ALTER PUBLICATION supabase_realtime ADD TABLE bubble_financial_events;
ALTER PUBLICATION supabase_realtime ADD TABLE gmail_events;
ALTER PUBLICATION supabase_realtime ADD TABLE dialpad_events;
ALTER PUBLICATION supabase_realtime ADD TABLE melio_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
