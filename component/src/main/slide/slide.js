/**
 * @author Brucewan
 * @version 1.0
 * @date 2014-06-18
 * @description 切换类
 * @extends mo.Tab
 * @name mo.Slide
 * @requires lib/zepto.js
 * @requires src/base.js
 * @requires src/tab.js
 * @param {boolean}  [config.touchMove=true] 是否允许手指滑动
  * @param {object|string} config.target 目标选项卡片，即供切换的 Elements list (Elements.length >= 2)
 * @param {object|string} [config.controller='ul>li*'] 触发器
 * @param {string} [config.direction='x'] 指定方向，仅效果为'slide'时有效
 * @param {boolean}  [config.autoPlay=false] 是否自动播放 
 * @param {number}  [config.playTo=0] 默认播放第几个（索引值计数，即0开始的计数方式） 
 * @param {string}  [config.type='mouseover'] 事件触发类型
 * @param {string}  [config.currentClass='current'] 当前样式名称, 多tab嵌套时有指定需求
 * @param {boolean}  [config.link=false] tab controller中的链接是否可被点击
 * @param {number}  [config.stay=2000] 自动播放时停留时间
 * @param {number}  [config.delay=150] mouseover触发延迟时间
 * @param {object|string}  [config.prevBtn] 播放前一张，调用prev()
 * @param {object|string}  [config.nextBtn] 插放后一张，调用next()
 * @param {string}  [config.easing='swing'] 动画方式：默认可选(可加载Zepto.easying.js扩充)：'swing', 'linear'
 * @param {object{string:function}}  [config.event] 初始化绑定的事件
 * @param {object{'dataSrc':Element, 'dataProp':String, 'dataWrap':Element, 'delay': Number}}  [config.title] 初始化绑定的事件
 * @param {boolean}  [config.lazy=false] 是否启用按需加载
 * @example
		var tab1 = new mo.Slide({
			target: $('#slide01 li')
		});
 * @see slide/demo1.html 普通滑动
 * @see slide/demo2.html 横向单屏滑动-扫二维码看效果
 * @see slide/demo3.html 带标题的滑动
 * @see slide/demo4.html 未命名滑动
 * @class
*/
define(function(require, exports, module) {
	require('../tab/tab.js');
	Motion.add('mo.Slide:mo.Tab', function() {
		/**
		 * public 作用域
		 * @alias mo.Slide#
		 * @ignore
		 */
		var _public = this;

		var _private = {};

		/**
		 * public static作用域
		 * @alias mo.Slide.
		 * @ignore
		 */
		var _static = this.constructor;



		_public.init = function(config) {
			this.config = Zepto.extend(true, {}, _static.config, config); // 参数接收
			
			// 初始化父类
			this.superClass.call(this, this.config);
		};

		_static.config = {
			touchMove: true
		};



		_public.effect = {
			init: function() {
				var self = this;
				var config = self.config;

				// 清除浮动
				self.container.css({
					'position': 'relative',
					'overflow': 'hidden'
				});
				self.container.css('-webkit-backface-visibility', 'hidden');
				self.wrap.css({
					'position': 'absolute',
					'left': 0,
					'top': 0
				});

				// 设置不同方向不同的操作属性
				if (config.direction == 'x') {

					// 初始化CSS
					self.target.css('float', 'left');

					var wrapWidth = 0;
					self.target.each(function(i, elem) {
						wrapWidth += Zepto(elem)[0].offsetWidth;
					});
					if (wrapWidth <= 0) {
						wrapWidth = document.documentElement.offsetWidth * self.target.length;
					}

					self.wrap.css('width', (config.wrapWidth || wrapWidth) + 'px');

					/**
					 * @event mo.Slide#touchstart
					 * @property {object} event 开始滑时动
					 */

					// 设置操作属性
					self.animProp = 'translateX'; // 为避免DOM树插入节点带来的风险，停用scrollLeft
					self.offsetProp = 'offsetLeft';
				} else {
					self.animProp = 'translateY';
					self.offsetProp = 'offsetTop';
				}


				// 滑动屏幕触发

				var touchMove, touchEnd, touchDirection;
				var d = {};
				if (config.touchMove) {
					self.wrap.on('touchstart', function(e) {
						if (self.trigger('touchstart') === false) {
							return;
						}

						d.pageX = e.touches[0].pageX;
						d.pageY = e.touches[0].pageY;
						// self.wrap.style.webkitTransitionDuration = '0ms';
						self.wrap.on('touchmove', touchMove);
						self.wrap.on('touchend', touchEnd);
						touchDirection = '';


						// self.wrap.addEventListener('touchcancel', touchEnd);
					});
				}
				touchMove = function(e) {
					d.disX = e.touches[0].pageX - d.pageX;
					d.disY = e.touches[0].pageY - d.pageY;

					if (config.direction == 'x') {
						d.dis = d.disX;
					} else {
						d.dis = d.disY;
					}

					if (!touchDirection) {
						if (Math.abs(d.disX / d.disY) > 1) {
							touchDirection = 'x';
						} else {
							touchDirection = 'y';
						}
					}

					if (self.trigger('touchmove') === false) {
						return;
					}

					// self.wrap.style.webkitTransform = 'translate3d(' + (d.dis - self.current * self.width) + 'px,0,0)';
					if (config.direction == touchDirection) {
						var o = {};
						o[self.animProp] = (d.dis - self.target[self.curPage][self.offsetProp]) + 'px';

						self.wrap.animate(o, 0);

						// if( (self.curPage <= 0  &&  d.dis > 0) || (self.curPage < self.target.length-1 && d.dis < 0) ) {
						if ((d.dis > 0 && self.curPage > 0) || (d.dis < 0 && self.curPage < self.target.length - 1)) {
							e.preventDefault();
						}
					}




				}
				touchEnd = function() {
					if (touchDirection && config.direction != touchDirection) {
						return;
					}
					if (d.dis === undefined || isNaN(d.dis)) {
						d.dis = 0;
					}

					// self.wrap.style.webkitTransitionDuration = config.animTime + 'ms';
					self.wrap.off('touchmove', touchMove);
					self.wrap.off('touchend', touchEnd);

					var isOK = true;
					if (config.ontouchend) {
						if (config.ontouchend.apply(self, [d.dis]) === false) {
							isOK = false;
						}
					}


					if (!d.dis || (Math.abs(d.dis) < config.touchDis || !isOK)) {
						self.playTo(self.curPage);
						return;
					}


					if (d.dis > 0) {
						var to = self.curPage - 1 < 0 ? 0 : self.curPage - 1;
						self.playTo(to);
					} else {
						var to = self.curPage + 1 >= self.target.length ? self.target.length - 1 : self.curPage + 1;
						self.playTo(to);
					}

					d.dis = 0;

				};

			},
			beforechange: function() {
				var self = this;
				var config = self.config;
				var from = self.prevPage === window.undefined ? 0 : self.prevPage;
				var to = self.curPage;
				var pos;
				var o = {};
				var animObj;

				o[self.animProp] = -self.target[to][self.offsetProp] + 'px';

				self.wrap.animate(o, config.animateTime, config.easing, function() {
					self.trigger('change');
				});



			}


		}




	});

});