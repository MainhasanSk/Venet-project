import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Alert, Card, Modal, Form } from 'react-bootstrap';
import './DrivingSimulation.css';

const DrivingSimulation = ({ onPointsCalculated }) => {
  // Registration State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [showRegistration, setShowRegistration] = useState(true);
  const [insuranceValid, setInsuranceValid] = useState(null);
  const [pollutionValid, setPollutionValid] = useState(null);
  const [documentsVerified, setDocumentsVerified] = useState(false);

  // Driving State
  const [isDriving, setIsDriving] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gear, setGear] = useState(1);
  const [lane, setLane] = useState(2); // Center lane
  const [trafficLight, setTrafficLight] = useState('red');
  const [isTrafficLightChanging, setIsTrafficLightChanging] = useState(false);
  const [warning, setWarning] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  // Time tracking
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds, for distance calculation display

  // Behavior Tracking
  const [points, setPoints] = useState(0);
  const [behaviors, setBehaviors] = useState([]);
  const [lastAcceleration, setLastAcceleration] = useState(0);
  const [lastBraking, setLastBraking] = useState(0);
  const [lastGearChange, setLastGearChange] = useState({ gear: 1, speed: 0 });
  const [lastLaneChange, setLastLaneChange] = useState({ lane: 2, speed: 0 });

  // Timers
  const drivingInterval = useRef(null);
  const trafficLightInterval = useRef(null);
  const warningTimeout = useRef(null);
  const redLightPenaltyInterval = useRef(null); // For continuous red light penalty

  // Summary Modal
  const [showSummary, setShowSummary] = useState(false);
  const [driveSummary, setDriveSummary] = useState({
    totalDistance: 0,
    totalPoints: 0,
    goodBehaviors: 0,
    badBehaviors: 0,
    duration: 0,
    averageSpeed: 0,
  });

  // Audio Refs
  const engineSound = useRef(null);
  const brakingSound = useRef(null);
  const signalSound = useRef(null);

  // Driving Timer
  const [drivingTime, setDrivingTime] = useState(0);

  // Track last update time for accurate distance calculation
  const lastUpdateTimeRef = useRef(Date.now());

  // Initialize Sounds
  useEffect(() => {
    engineSound.current = new Audio('/sounds/engine.mp3');
    engineSound.current.loop = true;
    brakingSound.current = new Audio('/sounds/brake.mp3');
    signalSound.current = new Audio('/sounds/signal.mp3');

    return () => {
      if (engineSound.current) engineSound.current.pause();
      if (brakingSound.current) brakingSound.current.pause();
      if (signalSound.current) signalSound.current.pause();
    };
  }, []);

  // Engine sound control
  useEffect(() => {
    if (!engineSound.current || !isDriving || speed <= 0) return;
    engineSound.current.play().catch(console.log);
    engineSound.current.volume = Math.min(0.3 + speed / 200, 1);
    engineSound.current.playbackRate = 0.8 + gear * 0.1 + speed / 200;
  }, [isDriving, speed, gear]);

  // Calculate distance based on speed and time formula: distance = speed * time
  const calculateDistance = (currentSpeed, timeInSeconds) => {
    // Convert km/h to km/s and calculate distance
    const speedInKmPerSecond = currentSpeed / 3600; // Convert km/h to km/s
    return speedInKmPerSecond * timeInSeconds;
  };

  // Start Driving Timer
  useEffect(() => {
    if (isDriving) {
      const timer = setInterval(() => {
        setDrivingTime(prev => prev + 1);
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isDriving]);

  // Update distance based on speed and time
  useEffect(() => {
    if (isDriving && speed > 0) {
      const distanceInterval = setInterval(() => {
        // Calculate distance increment for 1 second
        const distanceIncrement = calculateDistance(speed, 1);
        setDistance(prev => parseFloat((prev + distanceIncrement).toFixed(3)));
        
        // Check gear-speed rule every second
        checkGearSpeedRule();
        
        // Check for overspeed condition and apply penalty for every km over 90
        if (speed > 90) {
          addBehavior('speeding', 'continuous overspeed');
          setPoints(p => p - 5);
          displayWarning("You are overspeeding! Reduce speed below 90 km/h. -5 points per km");
        }
        
        // Check if traffic light is red and vehicle is still running
        if (trafficLight === 'red' && speed > 0) {
          addBehavior('traffic violation', 'running on red light');
          setPoints(p => p - 5);
          displayWarning("RED LIGHT VIOLATION! Stop immediately! -5 points per second");
        }
      }, 1000);
      
      return () => clearInterval(distanceInterval);
    }
  }, [isDriving, speed, gear, trafficLight]);

  // Traffic light response timer
  const [trafficResponseTimer, setTrafficResponseTimer] = useState(null);
  const trafficResponseTimeoutRef = useRef(null);

  // Start Traffic Light Cycle (more frequent for testing - every 30 seconds)
  const startTrafficLightCycle = () => {
    clearInterval(trafficLightInterval.current);
    trafficLightInterval.current = setInterval(() => {
      setIsTrafficLightChanging(true);
      setTimeout(() => {
        setTrafficLight('red');
        // Start the 5-second response timer for traffic action
        setTrafficResponseTimer(5);
        // Set a countdown timer
        let timeLeft = 5;
        trafficResponseTimeoutRef.current = setInterval(() => {
          timeLeft -= 1;
          setTrafficResponseTimer(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(trafficResponseTimeoutRef.current);
            // Penalize if no action taken within 5 seconds
            addBehavior('traffic light', 'delayed response');
            setPoints(p => p - 5);
            displayWarning("You failed to respond to the red light in time! -5 points");
          }
        }, 1000);
        
        setTimeout(() => {
          clearInterval(trafficResponseTimeoutRef.current);
          setTrafficLight('green');
          setTrafficResponseTimer(null);
          setIsTrafficLightChanging(false);
        }, 10000); // Red light stays for 10 seconds
      }, 500);
    }, 30000); // Changed to 30 seconds for testing purposes
  };

  // Document Verification
  const checkDocuments = () => {
    if (!vehicleNumber || vehicleNumber.length < 6) {
      displayWarning("Please enter a valid vehicle number.");
      return;
    }

    setInsuranceValid(Math.random() > 0.2);
    setPollutionValid(Math.random() > 0.2);
    setDocumentsVerified(true);
  };

  // Start Simulation
  const startDriving = () => {
    if (!insuranceValid || !pollutionValid) {
      displayWarning("Cannot start driving. Please ensure all documents are valid.");
      return;
    }

    setIsDriving(true);
    setShowRegistration(false);
    setSpeed(0);
    setDistance(0);
    setElapsedTime(0);
    setGear(1);
    setLane(2);
    setPoints(0);
    setBehaviors([]);
    setDrivingTime(0);

    lastUpdateTimeRef.current = Date.now();
    startTrafficLightCycle();
  };

  // End Drive
  const endDriving = () => {
    setIsDriving(false);
    clearInterval(drivingInterval.current);
    clearInterval(trafficLightInterval.current);
    clearInterval(redLightPenaltyInterval.current);
    assessDrivingBehavior(true);
    const goodCount = behaviors.filter(b => b.points > 0).length;
    const badCount = behaviors.filter(b => b.points < 0).length;
    
    // Calculate average speed
    const averageSpeed = drivingTime > 0 ? parseFloat((distance / (drivingTime / 3600)).toFixed(2)) : 0;
    
    setDriveSummary({
      totalDistance: parseFloat(distance.toFixed(2)),
      totalPoints: points,
      goodBehaviors: goodCount,
      badBehaviors: badCount,
      duration: drivingTime,
      averageSpeed: averageSpeed
    });
    setShowSummary(true);
  };

  // Submit Final Points
  const submitDrivingPoints = () => {
    setShowSummary(false);
    onPointsCalculated(points);
  };

  // Accelerate
  const accelerate = () => {
    if (!isDriving) return;
    
    // Check if traffic signal is red - violating traffic rule
    if (trafficLight === 'red') {
      addBehavior('traffic violation', 'accelerating on red');
      setPoints(p => p - 10);
      displayWarning("You are violating traffic rules! Don't accelerate on red light.");
    } else if (trafficLight === 'green') {
      // Award points for accelerating on green light
      addBehavior('traffic compliance', 'accelerating on green');
      setPoints(p => p + 5);
      displayWarning("Good! Accelerating on green light.");
    }
    
    setSpeed(prev => {
      const maxIncrease = 5 + (gear * 2);
      const actualIncrease = Math.min(maxIncrease, 120 - prev);
      const newSpeed = Math.min(120, prev + actualIncrease);
      
      // Check for overspeed condition
      if (newSpeed > 90) {
        addBehavior('speeding', 'overspeed');
        setPoints(p => p - 5);
        displayWarning("You are overspeeding! Reduce speed below 90 km/h.");
      }
      
      setLastAcceleration(Date.now());
      return newSpeed;
    });
  };

  // Brake
  const brake = () => {
    if (!isDriving) return;
    brakingSound.current?.play();
    setSpeed(prev => {
      const newSpeed = Math.max(0, prev - 10);
      const timeSince = Date.now() - lastBraking;
      if (prev > 30 && timeSince > 3000) {
        addBehavior('braking', 'safe');
      } else if (prev > 0) {
        addBehavior('braking', 'unsafe');
      }
      setLastBraking(Date.now());
      return newSpeed;
    });
  };

  // Gear Controls
  const increaseGear = () => {
    if (!isDriving || gear >= 6) return;
    const newGear = gear + 1;
    setGear(newGear);
    checkGearChangeRule(lastGearChange.speed, speed);
    setLastGearChange({ gear: newGear, speed });
  };

  const decreaseGear = () => {
    if (!isDriving || gear <= 1) return;
    const newGear = gear - 1;
    setGear(newGear);
    checkGearChangeRule(lastGearChange.speed, speed);
    setLastGearChange({ gear: newGear, speed });
  };

  // Check Gear and Speed Rules
  const checkGearSpeedRule = () => {
    // Gear is 1 and speed > 30km/h - reduce 5 points
    if (gear === 1 && speed > 30) {
      addBehavior('gear-speed', 'improper gear 1');
      setPoints(p => p - 5);
      displayWarning("Speed too high for gear 1! Change to higher gear. -5 points");
      return true;
    }
    // Gear is 2 and speed > 45km/h - reduce 5 points
    else if (gear === 2 && speed > 45) {
      addBehavior('gear-speed', 'improper gear 2');
      setPoints(p => p - 5);
      displayWarning("Speed too high for gear 2! Change to higher gear. -5 points");
      return true;
    }
    return false;
  };
  
  // We'll no longer use the old gear change rule
  const checkGearChangeRule = (oldSpeed, newSpeed) => {
    // This function is kept for backward compatibility but will not add points
  };

  // Lane Change Rule: Speed < 30 → +10 Points, otherwise -5 points
  const changeLane = (newLane) => {
    if (!isDriving || newLane === lane || newLane < 1 || newLane > 3) return;
    if (speed < 30) {
      addBehavior('lane change', 'proper');
      setPoints(p => p + 10);
      displayWarning("Proper lane change under 30 km/h! +10 points");
    } else {
      addBehavior('lane change', 'improper');
      setPoints(p => p - 5);
      displayWarning("Dangerous lane change at high speed! Slow down below 30 km/h. -5 points");
    }
    setLane(newLane);
    setLastLaneChange({ lane: newLane, speed });
  };

  // Stop Vehicle Rule: Speed < 20 → +20 Points
  useEffect(() => {
    if (isDriving && speed === 0 && lastBraking < Date.now() - 1000) {
      setPoints(p => p + 20);
      addBehavior("stop", "safe");
      displayWarning("You stopped safely at low speed (<20 km/h). Well done!");
    }
  }, [speed]);

  // Traffic Light Handler
  const handleTrafficAction = () => {
    if (!isDriving) return;

    if (trafficLight === "red") {
      // Clear the response timer since action was taken
      clearInterval(trafficResponseTimeoutRef.current);
      setTrafficResponseTimer(null);
      
      if (speed === 0) {
        addBehavior("traffic light", "proper response");
        setPoints(p => p + 10);
        displayWarning("Good job! Properly stopped at red light. +10 points");
      } else {
        setSpeed(0);
        addBehavior("traffic light", "improper response");
        setPoints(p => p - 5);
        displayWarning("Red light detected! You must stop completely. -5 points");
      }
    } else if (trafficLight === "green") {
      displayWarning("Green signal. You may proceed.");
    }
  };

  // Add Behavior Log - No automatic point assignment
  const addBehavior = (action, quality, customPoints = null) => {
    // Points are now managed in the specific rule functions
    // This log function just records the behavior
    const behavior = {
      action,
      quality,
      points: customPoints !== null ? customPoints : 0, // For log display only
      timestamp: new Date().toLocaleTimeString(),
      speed: Math.round(speed),
      gear,
    };
    setBehaviors([behavior, ...behaviors]);
    // No automatic point adjustment here
  };

  // Assess Driving Behavior - Only used for final assessment now
  const assessDrivingBehavior = (isFinal = false) => {
    if (isFinal) {
      const goodCount = behaviors.filter(b => b.points > 0).length;
      const badCount = behaviors.filter(b => b.points < 0).length;
      addBehavior('overall driving', goodCount > badCount * 2 ? 'consistent' : 'inconsistent');
    }
  };

  // Display Warning Message
  const displayWarning = (message) => {
    setWarning(message);
    setShowWarning(true);
    clearTimeout(warningTimeout.current);
    warningTimeout.current = setTimeout(() => setShowWarning(false), 4000);
  };

  // Format Time
  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Get Lane Name
  const getLaneName = n => ['Left', 'Center', 'Right'][n - 1];

  // Cleanup Intervals
  useEffect(() => {
    return () => {
      clearInterval(drivingInterval.current);
      clearInterval(trafficLightInterval.current);
      clearTimeout(warningTimeout.current);
      clearInterval(redLightPenaltyInterval.current);
    };
  }, []);

  return (
    <Container className="driving-simulator-container">
      {showRegistration ? (
        <Card className="registration-card">
          <Card.Body>
            <Card.Title className="text-center mb-4">Vehicle Registration</Card.Title>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Vehicle Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter vehicle number (e.g., MH02AB1234)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" onClick={checkDocuments} disabled={!vehicleNumber || vehicleNumber.length < 6} className="w-100">
                Verify Documents
              </Button>

              {documentsVerified && (
                <div className="mt-4">
                  <h6>Document Verification Results:</h6>
                  <div className="d-flex justify-content-between">
                    <span>Insurance:</span>
                    <span className={insuranceValid ? 'text-success' : 'text-danger'}>
                      {insuranceValid ? 'VALID' : 'INVALID'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Pollution Certificate:</span>
                    <span className={pollutionValid ? 'text-success' : 'text-danger'}>
                      {pollutionValid ? 'VALID' : 'INVALID'}
                    </span>
                  </div>
                  <div className="mt-3 text-center">
                    {insuranceValid && pollutionValid ? (
                      <Button variant="success" onClick={startDriving} className="w-100 mt-2">
                        Start Driving
                      </Button>
                    ) : (
                      <Alert variant="warning" className="mt-2">
                        Cannot start driving. Please ensure all documents are valid.
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Dashboard */}
          <div className={`dashboard ${trafficLight === 'red' ? 'dashboard-red' : ''}`}>
            <div className="dashboard-container">
              <Row>
                <Col lg={8}>
                  <div className="main-dashboard">

                    {/* Digital Meters */}
                    <div className="digital-dashboard">
                      <div className="digital-meter"><h5>Speed</h5><div className="value">{speed} km/h</div></div>
                      <div className="digital-meter" key={`distance-${distance}`}>
                        <h5>Distance</h5>
                        <div className="value">{distance.toFixed(2)} km</div>
                      </div>
                      <div className="digital-meter"><h5>Time</h5><div className="value">{formatTime(drivingTime)}</div></div>
                      <div className="digital-meter"><h5>Gear</h5><div className="value">G{gear}</div></div>
                      <div className="digital-meter"><h5>Lane</h5><div className="value">{getLaneName(lane)}</div></div>
                      <div className="digital-meter">
                        <h5>Points</h5>
                        <div className={`value ${points >= 0 ? 'positive' : 'negative'}`}>{points}</div>
                      </div>
                    </div>

                    {/* Traffic Light with Timer */}
                    <div className="traffic-light-box">
                      <div className={`traffic-light ${isTrafficLightChanging ? 'blinking' : ''}`}>
                        <div className={`light red ${trafficLight === 'red' ? 'active' : ''}`}></div>
                        <div className={`light green ${trafficLight === 'green' ? 'active' : ''}`}></div>
                      </div>
                      {trafficResponseTimer !== null && (
                        <div className="traffic-timer">
                          Respond in: <span className="timer-value">{trafficResponseTimer}</span> sec
                        </div>
                      )}
                    </div>
                    

                    {/* Controls */}
                    <div className="controls-container">
                      <div className="control-group">
                        <h6>Speed Controls</h6>
                        <div className="control-buttons">
                          <Button variant="success" onClick={accelerate} disabled={!isDriving}>Accelerate</Button>
                          <Button variant="danger" onClick={brake} disabled={!isDriving}>Brake</Button>
                        </div>
                      </div>
                      <div className="control-group">
                        <h6>Gear Controls</h6>
                        <div className="control-buttons">
                          <Button variant="secondary" onClick={decreaseGear} disabled={!isDriving || gear <= 1}>Gear Down</Button>
                          <div className="gear-indicator">{gear}</div>
                          <Button variant="secondary" onClick={increaseGear} disabled={!isDriving || gear >= 6}>Gear Up</Button>
                        </div>
                      </div>
                      <div className="control-group">
                        <h6>Lane Controls</h6>
                        <div className="control-buttons">
                          <Button variant={lane === 1 ? "primary" : "outline-primary"} onClick={() => changeLane(1)} disabled={!isDriving || lane === 1}>Left</Button>
                          <Button variant={lane === 2 ? "primary" : "outline-primary"} onClick={() => changeLane(2)} disabled={!isDriving || lane === 2}>Center</Button>
                          <Button variant={lane === 3 ? "primary" : "outline-primary"} onClick={() => changeLane(3)} disabled={!isDriving || lane === 3}>Right</Button>
                        </div>
                      </div>
                      <div className="control-group">
                        <h6>Traffic Controls</h6>
                        <div className="control-buttons">
                          <Button variant="info" onClick={handleTrafficAction} disabled={!isDriving}>Traffic Action</Button>
                          <Button variant="warning" onClick={endDriving} disabled={!isDriving}>End Drive</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col lg={4}>
                  <div className="behavior-log">
                    <h5>Driving Behavior Log</h5>
                    <div className="log-entries">
                      {behaviors.length === 0 ? (
                        <p className="text-muted">No behaviors recorded yet.</p>
                      ) : (
                        behaviors.map((b, i) => (
                          <div key={i} className={`log-entry ${b.points > 0 ? 'good-behavior' : 'bad-behavior'}`}>
                            <div className="log-entry-time">{b.timestamp}</div>
                            <div className="log-entry-details">
                              <span className="log-entry-action">{b.action}</span>: 
                              <span className="log-entry-quality"> {b.quality}</span>
                              <span className="log-entry-points">
                                {b.points > 0 ? `+${b.points}` : b.points} pts
                              </span>
                            </div>
                            <div className="log-entry-context">
                              Speed: {b.speed} km/h, Gear: {b.gear}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Warning Alert */}
            {showWarning && (
              <div className="warning-alert">
                <Alert variant="warning">{warning}</Alert>
              </div>
            )}

          </div>
        </>
      )}

      {/* Summary Modal */}
      <Modal show={showSummary} onHide={() => setShowSummary(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Driving Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="summary-stats">
            <div className="summary-stat"><span>Total Distance:</span><span className="stat-value">{driveSummary.totalDistance} km</span></div>
            <div className="summary-stat"><span>Driving Duration:</span><span className="stat-value">{formatTime(driveSummary.duration)}</span></div>
            <div className="summary-stat"><span>Average Speed:</span><span className="stat-value">{driveSummary.averageSpeed} km/h</span></div>
            <div className="summary-stat"><span>Total Points Earned:</span><span className={`stat-value ${driveSummary.totalPoints >= 0 ? 'text-success' : 'text-danger'}`}>{driveSummary.totalPoints}</span></div>
            <div className="summary-stat"><span>Good Behaviors:</span><span className="stat-value text-success">{driveSummary.goodBehaviors}</span></div>
            <div className="summary-stat"><span>Bad Behaviors:</span><span className="stat-value text-danger">{driveSummary.badBehaviors}</span></div>
          </div>
          <div className="driving-score">
            <h5>Overall Rating:</h5>
            <div className={`score-badge ${driveSummary.totalPoints >= 50 ? 'excellent' : driveSummary.totalPoints >= 20 ? 'good' : 'needs-improvement'}`}>
              {driveSummary.totalPoints >= 50 ? 'Excellent Driver' :
               driveSummary.totalPoints >= 20 ? 'Good Driver' :
               'Needs Improvement'}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={submitDrivingPoints}>
            {driveSummary.totalPoints} Point{driveSummary.totalPoints !== 1 ? 's' : ''}
          </Button>
          
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DrivingSimulation;