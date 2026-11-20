Habits that help you notice these things

When you build or learn a feature, ask yourself a few questions:

Where does this data live? (Memory, database, file, Redis?)
What happens if the app restarts? Is anything lost?
What happens if there are 2, 5, or 50 copies of the app?
What happens if 1,000 requests arrive at the same moment?
What happens if someone abuses this? (This is how you arrive at rate limiting.)
What happens if the database or another service is slow or down?