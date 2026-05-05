import { useEffect, useRef, useState } from "react";

export default function SimpleTimeline({ year: controlledYear, onYearChange }) {
    const MIN = -600;
    const MAX = 2000;
    const MIN_WIDTH = 320;
    const EDGE_PADDING = 42;
    const AXIS_COLOR = "rgba(255, 255, 255, 0.92)";
    const LABEL_COLOR = "rgba(236, 245, 255, 0.95)";
    const containerRef = useRef(null);

    const [internalYear, setInternalYear] = useState(381);
    const [width, setWidth] = useState(1200);
    const year = Number.isFinite(controlledYear) ? controlledYear : internalYear;

    const totalYears = MAX - MIN;
    const trackWidth = Math.max(0, width - EDGE_PADDING * 2);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateWidth = () => {
            const nextWidth = Math.max(MIN_WIDTH, Math.floor(el.clientWidth));
            setWidth(nextWidth);
        };

        updateWidth();

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(updateWidth);
            observer.observe(el);
            return () => observer.disconnect();
        }

        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const formatYear = (y) => {
        if (y < 0) return `${Math.abs(y)} BCE`;
        if (y === 0) return "0 CE";
        return `${y} CE`;
    };

    const getX = (y) => EDGE_PADDING + ((y - MIN) / totalYears) * trackWidth;

    const handleYearChange = (nextYear) => {
        if (!Number.isFinite(controlledYear)) {
            setInternalYear(nextYear);
        }
        if (typeof onYearChange === "function") {
            onYearChange(nextYear);
        }
    };

    return (
        <div ref={containerRef} style={{ width: "100%", padding: "8px 0 2px" }}>
            <div style={{ position: "relative", width: "100%", margin: "0 auto" }}>

                {/* 🔴 FLOATING TIME DISPLAY */}
                <div
                    style={{
                        position: "absolute",
                        top: "-40px",
                        left: `${getX(year)}px`,
                        transform: "translateX(-50%)",
                        background: "#b91c1c",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontWeight: "bold"
                    }}
                >
                    {year}
                </div>

                {/* SVG SCALE */}
                <svg width={width} height={80}>
                    <line x1={EDGE_PADDING} x2={width - EDGE_PADDING} y1="40" y2="40" stroke={AXIS_COLOR} strokeWidth="2" />

                    {Array.from({ length: totalYears + 1 }).map((_, i) => {
                        const y = MIN + i;

                        if (y % 10 !== 0) return null;

                        const isMajor = y % 100 === 0;
                        const x = getX(y);

                        return (
                            <g key={y}>
                                <line
                                    x1={x}
                                    x2={x}
                                    y1={isMajor ? 25 : 32}
                                    y2={40}
                                    stroke={AXIS_COLOR}
                                    strokeWidth={isMajor ? 2 : 1}
                                />

                                {y % 200 === 0 && (
                                    <text
                                        x={x}
                                        y={65}
                                        fontSize="12"
                                        textAnchor={y === MIN ? "start" : y === MAX ? "end" : "middle"}
                                        fill={LABEL_COLOR}
                                    >
                                        {formatYear(y)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* 🔘 KNOB (moves correctly now) */}
                <div
                    style={{
                        position: "absolute",
                        left: `${getX(year)}px`,
                        top: "40px",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none"
                    }}
                >
                    <div
                        style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#b91c1c",
                            border: "4px solid white"
                        }}
                    />
                </div>

                {/* SLIDER */}
                <input
                    type="range"
                    min={MIN}
                    max={MAX}
                    step={1}
                    value={year}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "80px",
                        opacity: 0,
                        cursor: "pointer"
                    }}
                />
            </div>
        </div>
    );
}