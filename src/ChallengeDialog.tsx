import React, { useState, useEffect } from 'react';
import BluetoothService from './services/BluetoothService';
import disconnectedIcon from './assets/disconnected.svg';
import connectedIcon from './assets/connected.svg';
import prizeIcon from './assets/prize.svg';
import vibrGif from './assets/vibr.gif';

interface ChallengeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (success: boolean) => void;
  totalSteps?: number;
}

type ChallengeStep = 'connect' | 'ready' | 'challenge' | 'interphase' | 'complete';

const ChallengeDialog: React.FC<ChallengeDialogProps> = ({ isOpen, onClose, onComplete, totalSteps = 6 }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ChallengeStep>('connect');
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [isInterphase, setIsInterphase] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setCurrentStep('connect');
      setCurrentChallenge(0);
      setIsInterphase(false);
      setError(null);
    }
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('connect');
      setCurrentChallenge(0);
      setIsInterphase(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  async function connect() {
    setConnecting(true);
    setError(null);
    
    try {
      const bluetoothService = BluetoothService.getInstance();
      const success = await bluetoothService.connect();
      
      if (success) {
        const bluetoothService = BluetoothService.getInstance();
        await bluetoothService.setVibration(5);
        await new Promise(resolve => setTimeout(resolve, 200));
        await bluetoothService.setVibration(0);
        
        setCurrentStep('ready');
      } else {
        setError('Failed to connect to device');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to device');
    } finally {
      setConnecting(false);
    }
  }

  async function startChallenge() {
    const shouldVibrate = Math.random() < 0.8;
    console.log("Should vibrate: " + shouldVibrate);
    setIsVibrating(shouldVibrate);
    
    if (shouldVibrate) {
      const bluetoothService = BluetoothService.getInstance();
      await bluetoothService.setVibration(19);
      setTimeout(() => bluetoothService.setVibration(0), 2000);
    }
  }

  async function handleChallengeResponse(response: 'yes' | 'no') {
    const isCorrect = (isVibrating && response === 'yes') || (!isVibrating && response === 'no');
    
    if (isCorrect) {
      setPoints(prev => prev + 1);
    }

    if (currentChallenge < totalSteps - 1) {
      setIsInterphase(true);
      setCompletedSteps(prev => [...prev, currentChallenge]);
      
      // Stop vibration if it's running
      if (isVibrating) {
        const bluetoothService = BluetoothService.getInstance();
        await bluetoothService.setVibration(0);
      }

      setTimeout(() => {
        setIsInterphase(false);
        setCurrentChallenge(prev => prev + 1);
        startChallenge();
      }, 500);
    } else {
      if (isVibrating) {
        const bluetoothService = BluetoothService.getInstance();
        await bluetoothService.setVibration(0);
      }
      const finalPoints = points + (isCorrect ? 1 : 0);
      setPoints(finalPoints);
      setCompletedSteps(prev => [...prev, currentChallenge]);
      setCurrentStep('complete');

      // Play victory or punishment vibration pattern
      const bluetoothService = BluetoothService.getInstance();
      if (finalPoints > totalSteps / 2) {
        // Victory pattern: cheerful melody with smooth transitions
        const playVictoryPattern = async () => {
          // Start with gentle build-up
          for (let i = 2; i <= 8; i += 2) {
            await bluetoothService.setVibration(i);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // First happy note
          await bluetoothService.setVibration(12);
          await new Promise(resolve => setTimeout(resolve, 400));
          await bluetoothService.setVibration(6);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Second happy note (higher)
          await bluetoothService.setVibration(15);
          await new Promise(resolve => setTimeout(resolve, 400));
          await bluetoothService.setVibration(8);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Third happy note (highest)
          await bluetoothService.setVibration(19);
          await new Promise(resolve => setTimeout(resolve, 400));
          await bluetoothService.setVibration(10);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Playful wave pattern
          for (let wave = 0; wave < 2; wave++) {
            for (let i = 4; i <= 16; i += 4) {
              await bluetoothService.setVibration(i);
              await new Promise(resolve => setTimeout(resolve, 150));
            }
            for (let i = 16; i >= 4; i -= 4) {
              await bluetoothService.setVibration(i);
              await new Promise(resolve => setTimeout(resolve, 150));
            }
          }
          
          // Grand finale
          await bluetoothService.setVibration(19);
          await new Promise(resolve => setTimeout(resolve, 600));
          await bluetoothService.setVibration(10);
          await new Promise(resolve => setTimeout(resolve, 300));
          await bluetoothService.setVibration(19);
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Gentle fade out
          for (let i = 16; i >= 0; i -= 4) {
            await bluetoothService.setVibration(i);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        };
        playVictoryPattern();
      } else {
        // Punishment pattern: 6 seconds continuous
        bluetoothService.setVibration(19);
        setTimeout(() => bluetoothService.setVibration(0), 6000);
      }
    }
  }

  function renderStepIndicator() {
    return (
      <div className="step-indicator" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
        {Array.from({ length: totalSteps }, (_, i) => i).map((step) => (
          <React.Fragment key={step}>
            <div
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                backgroundColor: step <= currentChallenge ? '#007bff' : '#ccc',
              }}
            />
            {step < totalSteps - 1 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: (isInterphase && step === currentChallenge) || completedSteps.includes(step) ? '#007bff' : '#ccc',
                    }}
                  />
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  function getTitle() {
    switch (currentStep) {
      case 'connect':
        return 'Yhdistä persesuristimesi';
      case 'ready':
        return 'Laite yhdistetty';
      case 'challenge':
        return isInterphase ? 'Valmistaudu seuraavaan' : 'Suriseeko?';
      case 'complete':
        return points <= totalSteps / 2 ? 'Rangaistussurina' : 'Nautinnollista kliimaksia';
      default:
        return '';
    }
  }

  function renderChallengeContent() {
    switch (currentStep) {
      case 'connect':
        return (
          <div className="rc-imageselect-challenge" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            minHeight: '200px'
          }}>
            <img src={disconnectedIcon} alt="Disconnected" style={{ width: '143px', height: '143px' }} />
          </div>
        );
      case 'ready':
        return (
          <div className="rc-imageselect-challenge" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            minHeight: '200px'
          }}>
            <img src={connectedIcon} alt="Connected" style={{ width: '143px', height: '143px' }} />
          </div>
        );
      case 'challenge':
        return (
          <div className="rc-imageselect-challenge" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            minHeight: '200px'
          }}>
            {renderStepIndicator()}

          </div>
        );
      case 'complete':
        return (
          <div className="rc-imageselect-challenge" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            minHeight: '200px'
          }}>
            {points > totalSteps / 2 ? (
              <>
                <img 
                  src={vibrGif}
                  alt="Complete" 
                  style={{ 
                    width: '143px', 
                    height: '143px',
                    transform: 'scale(1.4)'
                  }} 
                />
              </>
            ) : (
              <img 
                src={prizeIcon} 
                alt="Complete" 
                style={{ 
                  width: '143px', 
                  height: '143px',
                  animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) infinite',
                  transformOrigin: '50% 50%'
                }} 
              />
            )}
            <style>
              {`
                @keyframes shake {
                  0%, 100% {
                    transform: translate3d(0, 0, 0) rotate(0deg);
                  }
                  10%, 30%, 50%, 70%, 90% {
                    transform: translate3d(-4px, -4px, 0) rotate(-5deg);
                  }
                  20%, 40%, 60%, 80% {
                    transform: translate3d(4px, 4px, 0) rotate(5deg);
                  }
                }
              `}
            </style>
          </div>
        );
      default:
        return null;
    }
  }

  function getButtonText() {
    switch (currentStep) {
      case 'connect':
        return connecting ? 'YHDISTETÄÄN...' : 'YHDISTÄ';
      case 'ready':
        return 'ALOITA';
      case 'complete':
        return points > totalSteps / 2 ? 'K-KIITOS' : 'AUTSS';
      default:
        return null;
    }
  }

  async function handleButtonClick() {
    switch (currentStep) {
      case 'connect':
        await connect();
        break;
      case 'ready':
        setCurrentStep('challenge');
        startChallenge();
        break;
      case 'complete':
        console.log(`Challenge completed! Points: ${points} / ${totalSteps}`);
        // Set CAPTCHA state and close dialog only when button is clicked
        onComplete(points > totalSteps / 2);
        onClose();
        break;
      default:
        break;
    }
  }

  const showButton = currentStep === 'connect' || currentStep === 'ready' || currentStep === 'complete';

  return (
    <div className="challenge-dialog-overlay">
      <div id="rc-imageselect" aria-modal="true" role="dialog">
        <div className="rc-imageselect-response-field"></div>
        <span className="rc-imageselect-tabloop-begin" tabIndex={0}></span>
        <div className="rc-imageselect-payload">
          <div className="rc-imageselect-instructions">
            <div className="rc-imageselect-desc-wrapper">
              <div className="rc-imageselect-desc" style={{ width: '240px', fontSize: '16px' }}>
                {getTitle()}
              </div>
            </div>
          </div>
          {renderChallengeContent()}
        </div>
        <div className="rc-footer">
          <div className="rc-separator"></div>
          <div className="rc-controls">
            <div className="primary-controls">
              <div className="rc-buttons">
                <div className="button-holder help-button-holder">
                  <button className="rc-button goog-inline-block rc-button-help" title="Help" id="recaptcha-help-button" tabIndex={2}></button>
                </div>
              </div>
              <div className="verify-button-holder">
                {showButton ? (
                  <button
                    className="rc-button-default goog-inline-block"
                    id="recaptcha-verify-button"
                    tabIndex={0}
                    onClick={handleButtonClick}
                    disabled={connecting}
                  >
                    {getButtonText()}
                  </button>
                ) : currentStep === 'challenge' && !isInterphase && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="rc-button-default goog-inline-block"
                      onClick={() => handleChallengeResponse('no')}
                      style={{ minWidth: '80px' }}
                    >
                      EI
                    </button>
                    <button
                      className="rc-button-default goog-inline-block"
                      onClick={() => handleChallengeResponse('yes')}
                      style={{ minWidth: '80px' }}
                    >
                      KYLLÄ
                    </button>
                  </div>
                )}
              </div>
            </div>
            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
          </div>
        </div>
        <span className="rc-imageselect-tabloop-end" tabIndex={0}></span>
      </div>
    </div>
  );
};

export default ChallengeDialog;