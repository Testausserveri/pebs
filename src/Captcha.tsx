import { useState, useRef } from 'react';
import ChallengeDialog from './ChallengeDialog';
import logo from './assets/logo.svg';

const Recaptcha = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [isChallengeVisible, setIsChallengeVisible] = useState(false);

  const spinnerRef = useRef(null);

  const handleInteraction = () => {
    if (isLoading || isChecked) return;
    setIsLoading(true);
    setVerificationComplete(false);
    setTimeout(() => {
      setIsChallengeVisible(true);
    }, 1000);
  };

  const handleChallengeComplete = (success: boolean) => {
    if (success) {
      setVerificationComplete(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsChecked(true);
      }, 400);
    } else {
      setVerificationComplete(false);
      setTimeout(() => {
        setIsLoading(false);
        setIsChecked(false);
      }, 400);
    }
    setIsChallengeVisible(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleInteraction();
    }
  };

  const checkboxClasses = [
    'recaptcha-checkbox', 'goog-inline-block',
    isChecked ? 'recaptcha-checkbox-checked' : 'recaptcha-checkbox-unchecked',
    'rc-anchor-checkbox',
    isLoading ? 'recaptcha-checkbox-loading' : '',
    isHovered && !isLoading && !isChecked ? 'recaptcha-checkbox-hover' : ''
  ].join(' ');

  const containerStyles = {
    cursor: (isLoading || isChecked) ? 'default' : 'pointer',
  };

  const spinnerStyles = isLoading ? { display: 'block', animationPlayState: 'running', opacity: 1 } : {};
  const overlayStyles = isLoading ? { animationPlayState: 'running' } : {};
  const borderStyles = (isLoading || verificationComplete) ? { display: 'none' } : {};

  return (
    <>
      <div
        id="rc-anchor-container"
        className="rc-anchor rc-anchor-normal rc-anchor-light"
        style={containerStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleInteraction}
      >
        <div id="recaptcha-accessible-status" className="rc-anchor-aria-status" aria-hidden="true">sensiCAPTCHA requires verification.</div>
        <div className="rc-anchor-error-msg-container" style={{ display: 'none' }}><span className="rc-anchor-error-msg" aria-hidden="true"></span></div>
        
        <div className="rc-anchor-content">
          <div className="rc-inline-block">
            <div className="rc-anchor-center-container">
              <div className="rc-anchor-center-item rc-anchor-checkbox-holder">
                <span
                  className={checkboxClasses}
                  role="checkbox" aria-checked={isChecked}
                  id="recaptcha-anchor" tabIndex={isLoading || isChecked ? -1 : 0}
                  dir="ltr" aria-labelledby="recaptcha-anchor-label"
                  onKeyPress={handleKeyPress}
                >
                  <div className="recaptcha-checkbox-border" role="presentation" style={borderStyles}></div>
                  <div className="recaptcha-checkbox-borderAnimation" role="presentation"></div>
                  <div ref={spinnerRef} className="recaptcha-checkbox-spinner" role="presentation" style={spinnerStyles}>
                    <div className="recaptcha-checkbox-spinner-overlay" style={overlayStyles}></div>
                  </div>
                  <div className="recaptcha-checkbox-checkmark" role="presentation"></div>
                </span>
              </div>
            </div>
          </div>
          <div className="rc-inline-block">
            <div className="rc-anchor-center-container">
              <label className="rc-anchor-center-item rc-anchor-checkbox-label" aria-hidden="true" role="presentation" id="recaptcha-anchor-label">
                <span aria-live="polite" aria-labelledby="recaptcha-accessible-status"></span>I'm not a robot
              </label>
            </div>
          </div>
        </div>

        <div className="rc-anchor-normal-footer">
          <div className="rc-anchor-logo-portrait" aria-hidden="true" role="presentation">
            <div className="rc-anchor-logo-img rc-anchor-logo-img-portrait">
              <img src={logo} alt="vibraCAPTCHA logo" style={{ width: '24px', height: '24px' }} />
            </div>
            <div className="rc-anchor-logo-text">vibraCAPTCHA</div>
          </div>
          <div className="rc-anchor-pt">
            <a href="#" rel="noopener noreferrer">Privacy</a>
            <span aria-hidden="true" role="presentation"> - </span>
            <a href="#" rel="noopener noreferrer">Terms</a>
          </div>
        </div>
      </div>

      <ChallengeDialog
        isOpen={isChallengeVisible}
        onClose={() => setIsChallengeVisible(false)}
        onComplete={handleChallengeComplete}
      />
    </>
  );
};

export default Recaptcha;