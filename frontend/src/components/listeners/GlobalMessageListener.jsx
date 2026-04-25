import { useGlobalMessageListener } from '../../hooks/useGlobalMessageListener';
import { useSessionListener } from '../../hooks/useSessionListener';

const GlobalMessageListener = () => {
  // Hook handles all the setup
  useGlobalMessageListener();
  
  // Listen for session-related events
  useSessionListener();

  // This component doesn't render anything visible
  return null;
};

export default GlobalMessageListener;
