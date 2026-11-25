"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = void 0;
var RateLimitError = /** @class */ (function (_super) {
    __extends(RateLimitError, _super);
    // public readonly retryAfterExpiresAt: number | undefined;
    function RateLimitError(action, coolDownStatus, retryAfterSeconds, //* public readonly  parameters are stored as property for the current instance automatically
    scope) {
        var _this = _super.call(this, "Too many requests. Please wait before trying again.") || this;
        _this.action = action;
        _this.coolDownStatus = coolDownStatus;
        _this.retryAfterSeconds = retryAfterSeconds;
        _this.scope = scope;
        _this.name = "RateLimitError";
        return _this;
        // this.retryAfterExpiresAt =
        //     retryAfterSeconds === undefined
        //         ? undefined
        //         : Date.now() + retryAfterSeconds * 1000;
    }
    return RateLimitError;
}(Error));
exports.RateLimitError = RateLimitError;
console.log(new RateLimitError("/login", "stored", 10, "route"));
