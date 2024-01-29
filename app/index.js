let timer;
let timeLeft;
let sessionActive;

function updateTime() {
  const totalSeconds = Math.floor(timeLeft / 1000); // Convert milliseconds to seconds
  const hours = Math.floor(totalSeconds / 3600); // Get total hours
  const minutes = Math.floor((totalSeconds % 3600) / 60); // Get remaining minutes
  const seconds = totalSeconds % 60; // Get remaining seconds

  // Format time to HH:MM:SS
  let formattedTime = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');

  if ((hours <= 0) && (minutes <= 0) && (seconds <= 0)) {
    formattedTime = "00:00";
    timeLeft = false;
  }

  document.getElementById('timer').textContent = formattedTime;
}

const setTimerState = (started) => { timer = started; };

document.getElementById('end-session').addEventListener('click', () => {
  if (timer) {
    clearInterval(timer);
    setTimerState(false);
  }
  timeLeft = null;
  
  updateTime();

  // Inform the main process to stop the session
  window.api.stopTimer();

  document.getElementById("start-session").classList.remove('hide');
  document.getElementById("end-session").classList.add('hide');
});

setTimerState(false);

function addTime(minutes) {
  if (sessionActive) {
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + minutes);
    updateTime();
  }
}

window.api.receive('update-timer', (realTimeLeft) => {
  timeLeft = realTimeLeft;
  console.log('realTimeLeft', realTimeLeft)
  updateTime(realTimeLeft);
});


document.getElementById('hours-button').addEventListener('click', function() {
  this.classList.add('active');
  document.getElementById('minutes-button').classList.remove('active');
  document.getElementById('custom-time-value').placeholder = "Hours";
});

document.getElementById('minutes-button').addEventListener('click', function() {
  this.classList.add('active');
  document.getElementById('hours-button').classList.remove('active');
  document.getElementById('custom-time-value').placeholder = "Min";
});

document.getElementById('start-session').addEventListener('click', () => {
  const timeValue = parseInt(document.getElementById('custom-time-value').value, 10) || 0;
  const isHoursActive = document.getElementById('hours-button').classList.contains('active');
  const totalSeconds = isHoursActive ? timeValue * 3600 : timeValue * 60;
  window.api.startTimer(totalSeconds); // Send the time in seconds

  document.getElementById("end-session").classList.remove('hide');
  document.getElementById("start-session").classList.add('hide');
});

document.getElementById('add-time').addEventListener('click', function() {
  console.log("Adding time!");
  
  const timeValue = parseInt(document.getElementById('custom-time-value').value, 10) || 0;
  const isHoursActive = document.getElementById('hours-button').classList.contains('active');
  const totalSeconds = isHoursActive ? timeValue * 3600 : timeValue * 60;
  
  console.log("time to add:", timeValue, isHoursActive ? "H" : "M");

  window.api.addTime(totalSeconds); // Send the time in seconds

  document.getElementById("end-session").classList.remove('hide');
  document.getElementById("start-session").classList.add('hide');
})
