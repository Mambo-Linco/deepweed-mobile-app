import { useAuth } from '../lib/auth'
import FeedbackInbox from './FeedbackInbox'
import MyFeedback from './MyFeedback'

// Admins get the inbox, farmers get their own messages and the replies.
export default function Feedback(props) {
  const { user } = useAuth()
  return user?.role === 'admin' ? <FeedbackInbox {...props} /> : <MyFeedback {...props} />
}
