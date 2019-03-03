function myFunction() {
  var email = 'xxxxx'
  var token = 'xxxxx'
  var inEventEmoji = ':date:'
  var noEventEmoji = ''
  var dayOffEmoji = ':day_off:'
  var lunchEmoji = ':lunch:'
  var ima = new Imananishiton(email, token, inEventEmoji, noEventEmoji, dayOffEmoji, lunchEmoji)
  ima.nanishiton()
}

var Imananishiton = function(email, token, inEventEmoji, noEventEmoji, dayOffEmoji, lunchEmoji) {
    this.email = email
    this.token = token
    this.inEventEmoji = inEventEmoji
    this.noEventEmoji = noEventEmoji
    this.dayOffEmoji = dayOffEmoji
    this.lunchEmoji = lunchEmoji
}

Imananishiton.prototype = {
  nanishiton: function() {
    var events = this.getCurrentEvents()
    var message = this.createStatusMessage(events[0])
    var emoji = this.createStatusEmoji(events[0])
    this.changeSlackStatus(message, emoji)
  },
  getCurrentEvents: function() {
    var start = new Date()
    var end = new Date(start.getTime() + 60 * 1000)
    var calendar = CalendarApp.getCalendarById(this.email)
    var events = calendar.getEvents(start, end)
    return events.sort(this.compareSchedule)
  },
  compareSchedule: function(first, second) {
    if ((first.isAllDayEvent() && second.isAllDayEvent()) || first.getStartTime() === second.getStartTime()) { return 0 }
    if (second.isAllDayEvent()) { return -1 }
    if (first.isAllDayEvent()) { return 1 }
    return first.getStartTime() < second.getStartTime() ? 1 : -1
  },
  createStatusMessage: function(event) {
    if (!event || this.isPrivateEvent(event) || !this.isAttendEvent(event)) {
      return ''
    }
    var message = 'なう：' + event.getTitle()
    if (event.getLocation() !== '') {
      if (event.getLocation().length > 20) {
        message += ' @ ' + event.getLocation().substr(0, 20) + '...'
      } else {
        message += ' @ ' + event.getLocation()
      }
    }
    if (event.isAllDayEvent()) {
      return message + '【終日】'
    }
    var schedule = this.getEventSchedule(event)
    return message + '【' + schedule['start'] + ' ～ ' + schedule['end'] + '】'
  },
  isPrivateEvent: function(event) {
    return event.getVisibility() !== CalendarApp.Visibility.DEFAULT
  },
  isAttendEvent: function(event) {
    return event.getMyStatus() !== CalendarApp.GuestStatus.NO
  },
  isDayOff: function(event) {
    return event.getTitle().match(/([全半]休|休暇|退社)/)
  },
  isLunch: function(event) {
    return event.getTitle().match(/(ランチ|昼食)/)
  },
  getEventSchedule: function(event) {
    return {
      start: Utilities.formatDate(event.getStartTime(), 'Asia/Tokyo', 'HH:mm'),
      end: Utilities.formatDate(event.getEndTime(), 'Asia/Tokyo', 'HH:mm'),
    }
  },
  createStatusEmoji: function(event) {
    if (!event || this.isPrivateEvent(event) || !this.isAttendEvent(event)) {
      return this.noEventEmoji
    } else if (this.isDayOff(event)) {
      return this.dayOffEmoji
    } else if (this.isLunch(event)) {
      return this.lunchEmoji
    } else {
      return this.inEventEmoji
    }
  },
  changeSlackStatus: function(message, emoji) {
    var profile = {
      'status_text': message,
      'status_emoji': emoji,
    }
    UrlFetchApp.fetch("https://slack.com/api/users.profile.set?token=" + this.token + "&profile=" + encodeURIComponent(JSON.stringify(profile)))
  },
}
