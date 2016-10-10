(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part === '..') {
          results.pop();
        } else if (part !== '.' && part !== '') {
          results.push(part);
        }
      }
      return results.join('/');
    };
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
require.register("scripts/feynman", function(exports, require, module) {
var Feynman;

module.exports = Feynman = (function() {
  var SPEED_INDICATOR_CLASS;

  SPEED_INDICATOR_CLASS = '.speed-indicator';

  function Feynman(api) {
    this.api = api;
    this.api.$audienceMood.onValue(_.bind(this.updateSpeedIndicator, this));
  }

  Feynman.prototype.updateSpeedIndicator = function(value) {
    var fastBar, middle, slowBar;
    if (Math.abs(value) > 1) {
      value = Math.sign(value);
    }
    fastBar = $("" + SPEED_INDICATOR_CLASS + " .fast-bar");
    slowBar = $("" + SPEED_INDICATOR_CLASS + " .slow-bar");
    fastBar.css({
      width: '0%'
    });
    slowBar.css({
      width: '0%'
    });
    if (value > 0) {
      fastBar.css({
        width: "" + (value * 50) + "%"
      });
    }
    if (value < 0) {
      slowBar.css({
        width: "" + (value * -50) + "%"
      });
    }
    middle = $("" + SPEED_INDICATOR_CLASS + " .middle");
    if (value === 0) {
      return middle.addClass('show');
    } else {
      return middle.removeClass('show');
    }
  };

  return Feynman;

})();
});

;require.register("scripts/initialize", function(exports, require, module) {
var API, Presentation, api;

require('./utils/bacon-helpers');

console.log('using mock api');

API = require('./server-api-mock');

Presentation = require('./presentation');

api = new API('/api');

api.$initialState.onValue(function(initialState) {
  return $(function() {
    var presentation;
    presentation = new Presentation(api);
    return api.startPresentation();
  });
});
});

;require.register("scripts/messages", function(exports, require, module) {
var Message,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

module.exports = Message = (function() {
  var MAX_MESSAGES, MESSAGES_CONTAINER_CLASS, MESSAGE_DURATION, MESSAGE_HEADER, TEMPLATE_CONTAINER_ID;

  MESSAGES_CONTAINER_CLASS = '.messages-container';

  TEMPLATE_CONTAINER_ID = '#message';

  MESSAGE_HEADER = 'Новый вопрос';

  MAX_MESSAGES = 6;

  MESSAGE_DURATION = 20000;

  function Message(api) {
    var checkMessages, templateString;
    this.api = api;
    this.removeMessages = __bind(this.removeMessages, this);
    templateString = $(TEMPLATE_CONTAINER_ID).html();
    this.templateFunc = _.template(templateString);
    this.api.$audienceMessages.onValue((function(_this) {
      return function(data) {
        return _this.showMessage(data);
      };
    })(this));
    checkMessages = (function(_this) {
      return function() {
        var currentTime, defferedShowMsg, diff, diffInMs, i, itemForShow, message, msgForRemove, _i, _j, _len, _len1, _ref, _ref1, _results;
        msgForRemove = [];
        currentTime = moment(Date.now());
        _ref = _this.messages;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          message = _ref[_i];
          diff = moment.duration(currentTime.diff(message.timeAdd));
          diffInMs = diff._milliseconds;
          if (diffInMs > MESSAGE_DURATION) {
            msgForRemove.push(message);
          }
        }
        _this.removeMessages(msgForRemove);
        _ref1 = _.range(msgForRemove.length);
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          i = _ref1[_j];
          if (_this.messagesBuffer.length > 0) {
            itemForShow = _this.messagesBuffer.pop();
            defferedShowMsg = function(iter) {
              return _.delay((function() {
                return _this.showMessage(itemForShow);
              }), Number(iter) * 1500);
            };
            _results.push(defferedShowMsg(i));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
    })(this);
    setInterval(checkMessages, 500);
  }

  Message.prototype.removeMessages = function(messagesForRemove) {
    var message, performDeleteMsg, _i, _len;
    for (_i = 0, _len = messagesForRemove.length; _i < _len; _i++) {
      message = messagesForRemove[_i];
      message.$msg.addClass('message-out');
      performDeleteMsg = function(mess) {
        var removeFromDom;
        removeFromDom = function() {
          var h, slideToggleMsg;
          h = mess.$msg.height();
          mess.$msg.height(h);
          mess.$msg.removeClass('message');
          mess.$msg.empty();
          slideToggleMsg = function() {
            return mess.$msg.slideToggle("slow", function() {
              return mess.$msg.remove();
            });
          };
          return setTimeout(slideToggleMsg, 13);
        };
        return _.delay(removeFromDom, 700);
      };
      performDeleteMsg(message);
    }
    return this.messages = _.difference(this.messages, messagesForRemove);
  };

  Message.prototype.messages = [];

  Message.prototype.messagesBuffer = [];

  Message.prototype.showMessage = function(data) {
    var $msg, header, message, timeAdd, type;
    if (this.messages.length >= MAX_MESSAGES) {
      return this.messagesBuffer.push(data);
    } else {
      message = data.message;
      type = data.type;
      header = type === 'twitter' ? '@' + data.userId : MESSAGE_HEADER;
      timeAdd = moment(Date.now());
      $msg = $(this.templateFunc({
        message: message,
        header: header,
        type: type
      }));
      this.messages.unshift({
        $msg: $msg,
        timeAdd: timeAdd
      });
      $(MESSAGES_CONTAINER_CLASS).append($msg);
      return setTimeout((function() {
        return $msg.addClass('message-in');
      }), 13);
    }
  };

  return Message;

})();
});

;require.register("scripts/participants", function(exports, require, module) {
var ANIMATION_DURATION, Participants, TEMPLATE_SELECTOR;

TEMPLATE_SELECTOR = '#participants-template';

ANIMATION_DURATION = 200;

module.exports = Participants = (function() {
  function Participants(api, rootSelector, initialState) {
    this.api = api;
    this.rootSelector = rootSelector;
    if (initialState == null) {
      initialState = {};
    }
    this.templateFunc = _.template($(TEMPLATE_SELECTOR).html());
    $(this.rootSelector).html(this.templateFunc());
    this.api.$listenerCount.onValue(_.bind(this.drawHumans, this));
    if (initialState.totalClients != null) {
      this.drawHumans(initialState.totalClients);
    }
  }

  Participants.prototype.drawHumans = function(amount) {
    var container, countCurrent, countNext, currentCount, i, root, _i, _j, _ref, _ref1;
    root = $(this.rootSelector);
    currentCount = root.find('.human').length;
    if (currentCount === amount) {
      return;
    }
    if (currentCount > amount) {
      for (i = _i = amount, _ref = currentCount - 1; amount <= _ref ? _i <= _ref : _i >= _ref; i = amount <= _ref ? ++_i : --_i) {
        root.find('.human').last().remove();
      }
    }
    if (currentCount < amount) {
      for (i = _j = currentCount, _ref1 = amount - 1; currentCount <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = currentCount <= _ref1 ? ++_j : --_j) {
        root.find('.people').append('<div class="human icon-person"></div>');
      }
    }
    countNext = root.find('.count-next');
    countCurrent = root.find('.count');
    container = root.find('.meter');
    countNext.text(amount);
    container.addClass('changed');
    return setTimeout(function() {
      container.removeClass('changed');
      return countCurrent.text(countNext.text());
    }, ANIMATION_DURATION);
  };

  return Participants;

})();
});

;require.register("scripts/poll-chart", function(exports, require, module) {
var CHART_DEFAULT_HEIGHT, CHART_DEFAULT_WIDTH, PollChart, safeFraction;

CHART_DEFAULT_WIDTH = 800.0;

CHART_DEFAULT_HEIGHT = 580.0;

safeFraction = function(a, b) {
  if (b === 0) {
    return 0.0;
  }
  return a / b;
};

module.exports = PollChart = (function() {

  /*
   * Параметры
   */
  PollChart.prototype.labelsColor = '#000000';

  PollChart.prototype.labelsFont = 'ProximaNova';

  PollChart.prototype.labelsSize = '28px';

  PollChart.prototype.labelsHeight = 80;

  PollChart.prototype.labelsPadding = 10;

  PollChart.prototype.barOuterPad = 0.1;

  PollChart.prototype.barPad = 0.08;

  PollChart.prototype.barAnimationDuration = 200;

  PollChart.prototype.barMinValue = 0.01;

  PollChart.prototype.sexyRatio = 0.7;


  /*
   * Конструктор
   */

  function PollChart(element, width, height) {
    this.element = element;
    this.width = width != null ? width : CHART_DEFAULT_WIDTH;
    this.height = height != null ? height : CHART_DEFAULT_HEIGHT;
    this.svg = d3.select(this.element).append('svg').attr('width', this.width).attr('height', this.height);
    this.barsHeight = this.height - this.labelsHeight;
    this.svg.append('g').attr('class', 'bars').attr('transform', (function(_this) {
      return function() {
        return "scale(1.0, -1.0) translate(0 -" + _this.barsHeight + ")";
      };
    })(this));
    this.svg.append('g').attr('class', 'labels').attr('transform', "translate(0 " + (this.barsHeight + this.labelsPadding) + ")");
  }


  /*
   * Обновляет данные для отрисовки
   * TODO: не работает при изменении количества элементов в опросе!
   */

  PollChart.prototype.updateData = function(pollData) {
    var dataLength, max, scaleX, _i, _results;
    dataLength = pollData.length;
    max = d3.max(pollData, function(d) {
      return d.weight;
    });
    scaleX = d3.scale.ordinal().domain((function() {
      _results = [];
      for (var _i = 0; 0 <= dataLength ? _i < dataLength : _i > dataLength; 0 <= dataLength ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this)).rangeRoundBands([0, this.width], this.barPad, this.barOuterPad);
    this.svg.select('g.bars').selectAll('rect').data(pollData).enter().append('rect').attr('x', function(d, i) {
      return scaleX(i);
    }).attr('width', scaleX.rangeBand());
    this.svg.select('g.bars').selectAll('rect').attr('fill', function(d) {
      return d.color;
    }).transition().ease('linear').duration(this.barAnimationDuration).attr('height', (function(_this) {
      return function(d) {
        var bmin, x;
        x = _this.sexyRatio * safeFraction(d.weight, max);
        bmin = _this.barMinValue * _this.height;
        return bmin + (_this.height - bmin) * x;
      };
    })(this)).attr('y', (function(_this) {
      return function(d) {
        return 0;
      };
    })(this));
    return this.svg.select('g.labels').selectAll('text').data(pollData).enter().append('text').attr('y', 0).attr('x', function(d, i) {
      return scaleX(i) + 0.5 * scaleX.rangeBand(i);
    }).attr('alignment-baseline', 'text-before-edge').attr('text-anchor', 'middle').attr('font-family', this.labelsFont).attr('font-size', this.labelsSize).attr('fill', this.labelsColor).text(function(d) {
      return d.label;
    });
  };

  PollChart.prototype.destroy = function() {
    this.svg.remove();
    return this.isDestroyed = true;
  };

  return PollChart;

})();
});

;require.register("scripts/presentation", function(exports, require, module) {
var PollChart, Presentation, plurals, pollTotalText,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

PollChart = require('./poll-chart');

plurals = require('./utils/plurals');


/*
 * Делает текст вида "уже 5 человек приняли решение"
 */

pollTotalText = function(total) {
  var peopleInflection, peopleText;
  peopleInflection = {
    'one': 'человек принял',
    'few': 'человекa приняли',
    'many': 'человек приняли',
    'other': 'человек приняли'
  };
  peopleText = peopleInflection[plurals.ru(total)];
  return "уже " + total + " " + peopleText + " решение";
};

module.exports = Presentation = (function() {
  function Presentation(api) {
    this.api = api;
    this.onSlideChanged = __bind(this.onSlideChanged, this);
    Reveal.initialize({
      controls: false,
      progress: false,
      history: false,
      center: true,
      transition: 'none',
      backgroundTransition: 'none',
      dependencies: [],
      width: 1440,
      height: 900,
      margin: 0,
      loop: true,
      slideNumber: false,
      maxScale: 3.0
    });
    Reveal.addEventListener('slidechanged', (function(_this) {
      return function(event) {
        var slide, slideName;
        slide = event.currentSlide;
        slideName = $(slide).data('slide-name');
        return _this.onSlideChanged(slideName);
      };
    })(this));
  }

  Presentation.prototype.finishPresentation = function() {
    return this.api.finishPresentation();
  };

  Presentation.prototype.startPoll = function(pollName, pollCfg) {
    var chart;
    console.log('startPoll:', pollName);
    this.api.startPoll(pollName, pollCfg);
    chart = this.chart = new PollChart('.poll-container', 1200);
    this.pollActive = true;
    return this.api.$pollState.onValue((function(_this) {
      return function(pollData) {
        var total;
        console.log('poll data:', pollData);
        if (chart.isDestroyed || (pollData == null)) {
          return;
        }
        total = d3.sum(pollData, function(d) {
          return d.count;
        });
        $('.poll-total').text(pollTotalText(total));
        _this.pollData = pollData;
        return _this.chart.updateData(pollData);
      };
    })(this));
  };

  Presentation.prototype.stopPoll = function() {
    console.log('stopPoll, @pollActive:', this.pollActive);
    if (!this.pollActive) {
      return;
    }
    this.pollActive = false;
    this.api.stopPoll();
    if (this.chart == null) {
      return;
    }
    if (!this.chart.isDestroyed) {
      return this.chart.destroy();
    }
  };

  Presentation.prototype.showPollResults = function() {
    var winner;
    if (this.pollData == null) {
      return;
    }
    winner = _.max(this.pollData, function(d) {
      return d.count;
    });
    $('section.poll-results').attr('data-background', winner.color);
    $('.winner-name').text(winner.label);
    return Reveal.sync();
  };

  Presentation.prototype.onSlideChanged = function(slideName) {
    console.log('slide changed:', slideName);
    switch (slideName) {
      case 'gen-poll':
        return this.startPoll('gen-poll', {
          title: 'Знакомы ли вы с генераторами в JS?',
          options: [
            {
              label: 'Да, уже использую',
              color: '#83CD29'
            }, {
              label: 'Слышал, но не пробовал',
              color: '#e74c3c'
            }, {
              label: 'Не знаком',
              color: '#3498db'
            }, {
              label: 'Я пришел покушать',
              color: '#9b59b6'
            }
          ]
        });
      case 'gen-poll-results':
        this.stopPoll();
        return this.showPollResults();
    }
  };

  return Presentation;

})();
});

;require.register("scripts/server-api-mock", function(exports, require, module) {
var API, APIImpl;

module.exports = API = (function() {
  API.PresentationState = {
    NOT_STARTED: 'not_started',
    ACTIVE: 'active',
    ENDED: 'ended'
  };

  API.prototype.PresentationState = API.PresentationState;

  function API(apiEndpoint) {
    console.debug("new API " + apiEndpoint);
    this._ = new APIImpl(apiEndpoint);
    this.$initialState = this._.$initialState.toProp();
    this.$listenerCount = this._.$listenerCount.toProp();
    this.$audienceMood = this._.$audienceMood.toProp();
    this.$audienceMessages = this._.$audienceMessages;
    this.$pollState = this._.$pollState.toProp();
  }

  API.prototype.startPresentation = function() {
    console.debug('api.startPresentation');
    this._.startPresentation();
    return void 0;
  };

  API.prototype.setSlideId = function(id) {
    console.debug("api.setSlideId '" + id + "'");
    this._.setSlideId(id);
    return id;
  };

  API.prototype.startPoll = function(id, poll) {
    console.debug("api.startPoll '" + id + "', " + (JSON.stringify(poll, null, '  ')));
    this._.startPoll(id, poll);
    return id;
  };

  API.prototype.stopPoll = function() {
    console.debug('api.stopPoll');
    this._.stopPoll();
    return void 0;
  };

  API.prototype.finishPresentation = function() {
    console.debug('api.finishPresentation');
    this._.finishPresentation();
    return void 0;
  };

  return API;

})();

APIImpl = (function() {
  var pollStateFromPoll, randomMessage, randomStream, randomizeListenerCount, randomizeMood, randomizePollState;

  function APIImpl(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.initialState = Math.random() < 0.5 ? {
      state: API.PresentationState.NOT_STARTED,
      listenerCount: 1
    } : {
      state: API.PresentationState.ACTIVE,
      listenerCount: 25,
      slide: '2',
      audienceMood: 2 * Math.random() - 1
    };
    this.state = this.initialState.state;
    this.$initialState = Bacon.later(100, this.initialState);
    this.$initialState.onValue((function(_this) {
      return function(initialState) {
        if (initialState.state !== API.PresentationState.NOT_STARTED) {
          return _this.initEvents();
        }
      };
    })(this));
    this.$listenerCount = new Bacon.Bus;
    this.$audienceMood = new Bacon.Bus;
    this.$pollState = new Bacon.Bus;
    this.$audienceMessages = new Bacon.Bus;
    this.$listenerCount.plug(this.$initialState.map('.listenerCount').skipNulls());
    this.$audienceMood.plug(this.$initialState.map('.audienceMood').skipNulls());
    this.$pollState.plug(this.$initialState.map('.pollState').skipNulls());
    this.slide = void 0;
  }

  APIImpl.prototype.startPresentation = function() {
    if (this.state !== API.PresentationState.NOT_STARTED) {
      return console.warn('presentation has been already started');
    }
    this.state = API.PresentationState.ACTIVE;
    this.initEvents();
    return void 0;
  };

  APIImpl.prototype.initEvents = function() {
    var noPoll;
    this.$listenerCountSrc = randomStream(500, 3000, this.initialState.listenerCount, randomizeListenerCount);
    this.$audienceMoodSrc = randomStream(100, 200, this.initialState.audienceMood, randomizeMood);
    this.$audienceMessagesSrc = randomStream(1000, 20000, null, randomMessage);
    noPoll = (function(_this) {
      return function() {
        return _this.pollId == null;
      };
    })(this);
    this.$listenerCount.plug(this.$listenerCountSrc);
    this.$audienceMood.plug(this.$audienceMoodSrc.filter(noPoll));
    return this.$audienceMessages.plug(this.$audienceMessagesSrc);
  };

  APIImpl.prototype.setSlideId = function(id) {
    return this.slide = id;
  };

  APIImpl.prototype.startPoll = function(id, poll) {
    var pollState;
    if (this.pollId != null) {
      this.stopPoll();
    }
    this.pollId = id;
    this.poll = poll;
    pollState = pollStateFromPoll(poll);
    this.$pollStateSrc = randomStream(500, 1000, pollState, randomizePollState);
    this.$pollState.plug(Bacon.later(0, pollState).concat(this.$pollStateSrc));
    return void 0;
  };

  APIImpl.prototype.stopPoll = function() {
    if (this.pollId == null) {
      return console.warn('no active poll to stop');
    }
    this.pollId = this.poll = void 0;
    this.$pollStateSrc.end();
    this.$pollState.push(void 0);
    return void 0;
  };

  APIImpl.prototype.finishPresentation = function() {
    if (this.state !== API.PresentationState.ACTIVE) {
      return console.warn('presentation is not started');
    }
    if (this.pollId != null) {
      this.stopPoll();
    }
    this.$listenerCountSrc.end();
    this.$audienceMoodSrc.end();
    this.$audienceMessagesSrc.end();
    return this.state = API.PresentationState.ENDED;
  };

  randomizeListenerCount = function(prevCount) {
    var maxD, minD;
    minD = prevCount < 30 ? 0 : -10;
    maxD = 15;
    return Math.min(142, prevCount + Math.floor(minD + (maxD - minD) * Math.random()));
  };

  randomizeMood = function(prevMood) {
    if (Math.random() > 0.97) {
      return (Math.random() > 0.5 ? 1 : -1) * (0.2 + 0.8 * Math.random());
    } else if (Math.abs(prevMood) > 0.01) {
      return prevMood / 1.1;
    } else {
      return 0;
    }
  };

  pollStateFromPoll = function(poll) {
    return _.map(poll.options, function(opt) {
      return {
        label: opt.label,
        color: opt.color,
        count: 0,
        weight: 0
      };
    });
  };

  randomizePollState = function(prevPollState) {
    var idx, newPollState, newTotal;
    newTotal = 0;
    newPollState = _.map(prevPollState, function(opt) {
      var count, rand;
      count = opt.count;
      rand = Math.random();
      if (rand > 0.95) {
        count = Math.max(0, count - 1);
      } else if (rand > 0.5) {
        count += 1 + Math.floor(3 * Math.random());
      }
      newTotal += count;
      return {
        count: count,
        label: opt.label,
        color: opt.color
      };
    });
    if (newTotal === 0) {
      idx = Math.floor(newPollState.length * Math.random());
      newPollState[idx].count += (newTotal = 1);
    }
    return _.each(newPollState, function(opt) {
      return opt.weight = opt.count / newTotal;
    });
  };

  randomMessage = (function() {
    var messages;
    messages = [
      {
        type: 'twitter',
        userId: 'epshenichniy',
        message: 'бобры пожрут планету'
      }, {
        type: 'inapp',
        userId: '1',
        message: 'кто здесь?'
      }, {
        type: 'inapp',
        userId: '2',
        message: 'уруру уруру'
      }, {
        type: 'inapp',
        userId: '3',
        message: 'Cookies are a contract between a browser and an http server, and are identified by a domain name. If a browser has a cookie set for particular domain, it will pass it as a part of all http requests to the host.'
      }, {
        type: 'twitter',
        userId: 'ururu',
        message: 'greetings from Urugvai!'
      }
    ];
    return function() {
      return messages[Math.floor(messages.length * Math.random())];
    };
  })();

  randomStream = function(minIntv, maxIntv, initialValue, valueRandomizer) {
    var $bus, $result, lastValue, next, schedule, timeoutId;
    $bus = new Bacon.Bus;
    lastValue = initialValue;
    timeoutId = void 0;
    schedule = function() {
      var timeout;
      timeout = Math.floor(minIntv + (maxIntv - minIntv) * Math.random());
      return timeoutId = setTimeout(next, timeout);
    };
    next = function() {
      $bus.push(lastValue = valueRandomizer(lastValue));
      return schedule();
    };
    $result = $bus.skipDuplicates();
    $result.end = function() {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
      return $bus.end();
    };
    schedule();
    return $result;
  };

  return APIImpl;

})();
});

;require.register("scripts/server-api", function(exports, require, module) {
var APIImpl, ServerAPI, utils;

module.exports = ServerAPI = (function() {
  ServerAPI.PresentationState = {
    NOT_STARTED: 'not_started',
    ACTIVE: 'active',
    ENDED: 'ended'
  };

  ServerAPI.prototype.PresentationState = ServerAPI.PresentationState;

  function ServerAPI(apiEndpoint) {
    console.debug("new API endpoint " + apiEndpoint);
    this._ = new APIImpl(apiEndpoint);
    this.$initialState = this._.$initialState.toProp();
    this.$listenerCount = this._.$listenerCount.toProp();
    this.$audienceMood = this._.$audienceMood.toProp();
    this.$audienceMessages = this._.$audienceMessages;
    this.$pollState = this._.$pollState.toProp();
  }

  ServerAPI.prototype.startPresentation = function() {
    console.debug('api.startPresentation');
    this._.startPresentation();
    return void 0;
  };

  ServerAPI.prototype.setSlideId = function(id) {
    console.debug("api.setSlideId '" + id + "'");
    this._.setSlideId(id);
    return id;
  };

  ServerAPI.prototype.startPoll = function(id, poll) {
    console.debug("api.startPoll '" + id + "', " + (JSON.stringify(poll, null, '  ')));
    this._.startPoll(id, poll);
    return id;
  };

  ServerAPI.prototype.stopPoll = function() {
    console.debug('api.stopPoll');
    this._.stopPoll();
    return void 0;
  };

  ServerAPI.prototype.finishPresentation = function() {
    console.debug('api.finishPresentation');
    this._.finishPresentation();
    return void 0;
  };

  return ServerAPI;

})();

utils = require('./utils/cookie-utils');

APIImpl = (function() {
  function APIImpl(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.clientData = utils.obtainClientData();
    this.sockjs = new SockJS(apiEndpoint);
    this.active = false;
    console.log("clientData: " + (JSON.stringify(this.clientData, null, '  ')));
    this.sockjs.onopen = (function(_this) {
      return function(evt) {
        return _this.on_open(evt);
      };
    })(this);
    this.sockjs.onmessage = (function(_this) {
      return function(evt) {
        return _this.on_message(evt);
      };
    })(this);
    this.sockjs.onclose = (function(_this) {
      return function(evt) {
        return _this.on_close(evt);
      };
    })(this);
    this.$listenerCount = new Bacon.Bus;
    this.$audienceMood = new Bacon.Bus;
    this.$pollState = new Bacon.Bus;
    this.$audienceMessages = new Bacon.Bus;
    this.$initialState = new Bacon.Bus;
  }

  APIImpl.prototype.send = function(type, data) {
    var e;
    if (data == null) {
      data = '';
    }
    if (!this.active) {
      return console.warn("API.send(" + type + "): connection is not established");
    }
    try {
      this.sockjs.send(JSON.stringify({
        type: type,
        data: data
      }));
    } catch (_error) {
      e = _error;
      console.error("cannot stringify message <" + type + ">: " + e);
    }
    return void 0;
  };

  APIImpl.prototype.on_open = function() {
    var clientId, presentationId, _ref;
    console.log('API [*] open, proto:', this.sockjs.protocol);
    this.active = true;
    _ref = this.clientData, clientId = _ref.clientId, presentationId = _ref.presentationId;
    return this.send('init', {
      clientId: clientId,
      presentationId: presentationId,
      isPresenter: true
    });
  };

  APIImpl.prototype.on_message = function(evt) {
    var data, e, type, _name, _ref;
    console.log('API [.] message:', evt.data);
    try {
      _ref = JSON.parse(evt.data), type = _ref.type, data = _ref.data;
    } catch (_error) {
      e = _error;
      console.error("API: failed to parse incoming message '" + evt.data + "'");
      return;
    }
    return typeof this[_name = 'on_' + type] === "function" ? this[_name](data) : void 0;
  };

  APIImpl.prototype.on_close = function(evt) {
    var reason;
    this.active = false;
    reason = evt && evt.reason;
    return console.log('API [*] close, reason:', reason);
  };

  APIImpl.prototype.on_initial_state = function(initialState) {
    return this.$initialState.push(initialState);
  };

  APIImpl.prototype.on_presentation_state = function(state) {};

  APIImpl.prototype.on_poll = function(poll) {};

  APIImpl.prototype.on_total = function(moodNumber) {
    return this.$listenerCount.push(moodNumber);
  };

  APIImpl.prototype.on_mood = function(moodNumber) {
    return this.$audienceMood.push(moodNumber);
  };

  APIImpl.prototype.on_question = function(message) {
    return this.$audienceMessages.push(message);
  };

  APIImpl.prototype.on_poll_results = function(poll_results) {
    return this.$pollState.push(poll_results);
  };

  APIImpl.prototype.startPresentation = function() {
    return this.send('start');
  };

  APIImpl.prototype.finishPresentation = function() {
    return this.send('finish');
  };

  APIImpl.prototype.startPoll = function(id, poll) {
    poll.id = id + Date.now().toString();
    return this.send('poll_start', poll);
  };

  APIImpl.prototype.stopPoll = function() {
    return this.send('poll_finish');
  };

  APIImpl.prototype.setSlideId = function(id) {};

  return APIImpl;

})();
});

;require.register("scripts/utils/bacon-helpers", function(exports, require, module) {
var nop;

if (typeof console === "undefined" || console === null) {
  nop = function() {};
  window.console = {
    log: nop,
    warn: nop,
    error: nop,
    debug: nop
  };
}

Bacon.Observable.prototype.skipNulls = (function() {
  var nonNull;
  nonNull = function(v) {
    return v != null;
  };
  return function() {
    return this.filter(nonNull);
  };
})();

Bacon.Observable.prototype.toProp = function(initialValue) {
  var $prop, value;
  $prop = this.toProperty.apply(this, arguments);
  value = void 0;
  $prop.get = function() {
    return value;
  };
  $prop.onValue(function(v) {
    return value = v;
  });
  return $prop;
};
});

;require.register("scripts/utils/cookie-utils", function(exports, require, module) {
var b64_to_utf8, listCookiesByName;

exports.obtainClientData = function() {
  var clientDataCookie, cookiesByName, e;
  try {
    cookiesByName = listCookiesByName();
    if ((clientDataCookie = cookiesByName.cd) == null) {
      return {};
    }
    return JSON.parse(b64_to_utf8(clientDataCookie));
  } catch (_error) {
    e = _error;
    if (typeof console !== "undefined" && console !== null) {
      if (typeof console.warn === "function") {
        console.warn('error parsing clientData cookie: ' + e);
      }
    }
    return {};
  }
};

exports.listCookiesByName = listCookiesByName = function() {
  var cookie, cookies, idx, _i, _len, _ref;
  cookies = {};
  _ref = document.cookie.split('; ');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    cookie = _ref[_i];
    idx = cookie.indexOf('=');
    if (idx >= 0) {
      cookies[cookie.substr(0, idx)] = cookie.substr(idx + 1);
    }
  }
  return cookies;
};

exports.b64_to_utf8 = b64_to_utf8 = function(str) {
  return unescape(decodeURIComponent(atob(str)));
};
});

;require.register("scripts/utils/plurals", function(exports, require, module) {
function isAmong(value, array) {
  for ( var i = 0; i < array.length; ++i ) {
    if (array[i] === value) { return true; }
  }
  return false;
}

module.exports.ru = function(n) {
  var mod10  = n % 10;
  var mod100 = n % 100;

  if ( mod10 === 1 && n % 100 !== 11 ) { return 'one'; }

  if ( isAmong(mod10, [ 2, 3, 4 ]) &&
    !isAmong(mod100, [ 12, 13, 14 ]) ) { return 'few'; }

  if ( isAmong(mod10, [ 0, 5, 6, 7, 8, 9 ]) ||
    isAmong(mod100, [ 11, 12, 13, 14 ]) ) { return 'many'; }

  return 'other';
};
});


//# sourceMappingURL=app-presenter.js.map