import EventEmitter from '../../base/EventEmitter.ts';
import * as $ from "jquery";
import * as _ from "lodash";

/**
* Represents a timescale
*/
/* @Mixin(EventEmitter)*/
export class TimeScale {
    private element : JQuery;
    private svg : d3.Selection<any>;
    private x : d3.time.Scale<Date, any>;
    private y : d3.scale.Linear<any, any>;
    private timeScalePath : d3.Selection<any>;
    private area : d3.svg.Area<any>;
    private brush : d3.svg.Brush<Date>;
    private clip : d3.Selection<any>;
    private brushGrip : d3.Selection<any>;
    private context : d3.Selection<any>;
    private brushEle : d3.Selection<any>;
    private xAxis : d3.Selection<any>;
    private _dimensions : { width: number; height: number; } = { width: 500, height: 500 };
    private _eventEmitter = new EventEmitter();
    private _data : TimeScaleDataItem[];

    /**
     * Constructor for the timescale
     */
    constructor(element: JQuery, dimensions?: any) {
        this.element = element;
        this.x = d3.time.scale<Date>();
        this.y = d3.scale.linear();
        this.buildTimeScale();
        if (!this.dimensions) {
            this.resizeElements();
        } else {
            this.dimensions = dimensions;
        }
    }

    /**
     * Returns the data contained in this timescale
     */
    public get data() {
        return this._data;
    }

    /**
     * Setter for the data
     */
    public set data(data: TimeScaleDataItem[]) {
        this._data = data;
        this.x.domain(d3.extent(data.map((d) => d.date)));
        this.y.domain([0, d3.max(data.map((d) => d.value))]);
        this.resizeElements();
    }

    /**
     * Gets an event emitter by which events can be listened to
     * Note: Would be nice if we could mixin EventEmitter
     */
    public get events () {
        return this._eventEmitter;
    }

    /**
     * Gets the dimensions of this timescale
     */
    public get dimensions() {
        return this._dimensions;
    }

    /**
     * Sets the dimensions of this timescale
     */
    public set dimensions(value: any) {
        $.extend(this._dimensions, value);
        this.resizeElements();
    }

    /**
     * Sets the currently selected range of dates
     */
    public set selectedRange(dates : Date[]) {
        if (dates && dates.length) {
            this.brush.extent(<any>dates);

            this.brush(d3.select(this.element.find(".brush")[0]));

            // now fire the brushstart, brushmove, and brushend events
            // remove transition so just d3.select(".brush") to just draw
            this.brush["event"](d3.select(this.element.find(".brush")[0]).transition().delay(1000))
        }
    }

    private bars : d3.Selection<any>;

    /**
     * Builds the initial timescale
     */
    private buildTimeScale() {
        this.svg = d3.select(this.element[0]).append("svg");

        this.clip = this.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect");

        this.context = this.svg.append("g")
            .attr("class", "context");

        this.bars = this.context.append("g")
            .attr("class", "bars")
            .style("fill", "rgba(0,100,200,.5)");

        this.xAxis = this.context.append("g")
            .attr("class", "x axis");

        var brushed = _.debounce(() => {
            this.events.raiseEvent("rangeSelected", this.brush.empty() ? [] : this.brush.extent());
        }, 200);

        this.brush = d3.svg.brush()
            .on("brush", brushed);
    }

    /**
     * Resizes all the elements in the graph
     */
    private resizeElements() {
        var margin = { top: 0, right: 10, bottom: 20, left: 10 },
            width = this._dimensions.width - margin.left - margin.right,
            height = this._dimensions.height - margin.top - margin.bottom;

        this.x.range([0, <any>width])
        this.y.range([0, height]);

        if (this.bars && this._data) {
            var tmp = this.bars
                .selectAll("rect")
                    .data(this._data);
            tmp
                .enter().append("rect");

            tmp
                .attr("transform", (d, i) => {
                    var rectHeight = this.y(d.value);
                    return  `translate(${this.x(d.date)},${height - rectHeight})`;
                })
                .style({ "width": 2 })
                .style("height", (d) => {
                    return this.y(d.value);
                });

            tmp.exit().remove();
        }

        this.svg
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        this.clip
            .attr("width", width)
            .attr("height", height);

        this.xAxis
            .attr("transform", "translate(0," + height + ")")
            .call(d3.svg.axis().scale(this.x).orient("bottom"));

        this.context
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.brush.x(<any>this.x);

        // Need to recreate the brush element for some reason
        d3.selectAll(this.element.find(".x.brush").toArray()).remove();
        this.brushEle = this.context.append("g")
            .attr("class", "x brush")
            .call(this.brush)
            .selectAll("rect")
            .attr("height", height + 7)
            .attr("y", -6);

        this.brushGrip = d3.select(this.element.find(".x.brush")[0])
            .selectAll(".resize").append("rect")
            .attr('x', -3)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr("y", (height / 2) - 15)
            .attr("width", 6)
            .attr("fill", "lightgray")
            .attr("height", 30);
    }
}

/**
 * Represents a data item on a timescale
 */
export interface TimeScaleDataItem {
    /**
     * The date of the time scale item
     */
    date: Date;

    /**
     * The value on the given date
     */
    value: number;
}