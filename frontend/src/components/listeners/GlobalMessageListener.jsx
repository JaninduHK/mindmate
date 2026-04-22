import { useGlobalMessageListener } from '../../hooks/useGlobalMessageListener';

const GlobalMessageListener = () => {
  // Hook handles all the setup
  useGlobalMessageListener();

  // This component doesn't render anything visible
  return null;
};

export default GlobalMessageListener;
