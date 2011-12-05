(function($) {

    $.fn.treemap = function(json, options) {

        function Rectangle(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.margin = 3;
        }

        Rectangle.prototype.style = function() {
            return {
                top: this.y + 'px',
                left: this.x + 'px',
                width: (this.width - this.margin) + "px",
                height: (this.height - this.margin) + "px"
            };
        }

        Rectangle.prototype.isWide = function() {
            return this.width > this.height;
        }

        function TreeMap($div, options) {
            var options = options || {};
            this.$div = $div;

            $div.css('position', 'relative');
            this.rectangle = new Rectangle(0, 0, $div.width(), $div.height());

            this.nodeClass = function() {return '';}
            this.click = function() {};
            this.mouseenter = function() {};
            this.mouseleave = function() {};

            $.extend(this, options);

            this.setNodeColors = function($box) {
                if (this.backgroundColor) $box.css('background-color', this.backgroundColor());
                if (this.color) $box.css('color', this.color());
            }
        }

        TreeMap.SIDE_MARGIN = 10;

        TreeMap.prototype.paint = function(nodeList) {
            var nodeList = this.squarify(nodeList, this.rectangle);

            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                var nodeBounds = node.bounds;

                var $box = $('<div></div>');
                $box.css($.extend(nodeBounds.style(), {
                    'position' : 'absolute'
                }));

                this.setNodeColors($box);

                $box.addClass('treemap-node');

                var self = this;
                $box.bind('click', node, function(e) {
                    self.click(e.data, e)
                });
                $box.bind('mouseenter', node, function(e) {
                    self.mouseenter(e.data, e)
                });
                $box.bind('mouseleave', node, function(e) {
                    self.mouseleave(e.data, e)
                });

                $box.appendTo(this.$div);
                $box.addClass(this.nodeClass(node, $box));

                var $label = $("<div><span>" + node.label + "</span></div>");
                $label.css({
                    'position': 'relative',
                    'text-align': 'center'
                });
                $box.append($label);
                $label.css('margin-top', (parseInt($box.height()) / 2) - (parseInt($label.height()) / 2) + 'px');

                if ($label.find('span').height() > nodeBounds.height || $label.find('span').width() + TreeMap.SIDE_MARGIN > nodeBounds.width) {
                    $box.html('');
                }

            }
        }

        TreeMap.HORIZONTAL = 1;
        TreeMap.VERTICAL = 2;

        TreeMap.prototype.squarify = function(nodeList, rectangle) {
            nodeList.sort(function(a, b) {
                return b.value - a.value;
            });
            this.divideDisplayArea(nodeList, rectangle);

            return nodeList;
        };

        TreeMap.prototype.divideDisplayArea = function(nodeList, destRectangle) {
            // Check for boundary conditions
            if (nodeList.length === 0) return;

            if (nodeList.length == 1) {
                nodeList[0].bounds = destRectangle;
                return;
            }

            var halves = this.splitFairly(nodeList);

            var midPoint;
            var orientation;

            var leftSum = this.sumValues(halves.left),
                    rightSum = this.sumValues(halves.right),
                    totalSum = leftSum + rightSum;

            if (leftSum + rightSum <= 0) {
                midPoint = 0;
                orientation = TreeMap.HORIZONTAL;
            } else {

                if (destRectangle.isWide()) {
                    orientation = TreeMap.HORIZONTAL;
                    midPoint = Math.round(( leftSum * destRectangle.width ) / totalSum);
                } else {
                    orientation = TreeMap.VERTICAL;
                    midPoint = Math.round(( leftSum * destRectangle.height ) / totalSum);
                }
            }

            if (orientation == TreeMap.HORIZONTAL) {
                this.divideDisplayArea(halves.left, new Rectangle(destRectangle.x, destRectangle.y, midPoint, destRectangle.height));
                this.divideDisplayArea(halves.right, new Rectangle(destRectangle.x + midPoint, destRectangle.y, destRectangle.width - midPoint, destRectangle.height));
            } else {
                this.divideDisplayArea(halves.left, new Rectangle(destRectangle.x, destRectangle.y, destRectangle.width, midPoint));
                this.divideDisplayArea(halves.right, new Rectangle(destRectangle.x, destRectangle.y + midPoint, destRectangle.width, destRectangle.height - midPoint));
            }
        };

        TreeMap.prototype.splitFairly = function(nodeList) {
            var halfValue = this.sumValues(nodeList) / 2;
            var accValue = 0;
            var length = nodeList.length;

            for (var midPoint = 0; midPoint < length; midPoint++) {
                if (midPoint > 0 && ( accValue + nodeList[midPoint].value > halfValue ))
                    break;
                accValue += nodeList[midPoint].value;
            }

            return {
                left: nodeList.slice(0, midPoint),
                right: nodeList.slice(midPoint)
            };
        };

        TreeMap.prototype.sumValues = function(nodeList) {
            var result = 0;
            var length = nodeList.length;
            for (var i = 0; i < length; i++)
                result += nodeList[i].value;
            return result;
        };

        new TreeMap(this, options).paint(json);
    };

})(jQuery);