import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { on } from "../events";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export function Statistics() {
    const dataset = new Array<number>();
    const chartRef = useRef(null)

    useEffect(() => {
        on('dlSpeed', (data: CustomEvent<any>) => {
            dataset.push(data.detail)
            chartRef.current.update()
        })
    }, [])

    const data = {
        labels: dataset.map(() => ''),
        datasets: [
            {
                data: dataset,
                label: 'download speed',
                borderColor: 'rgb(53, 162, 235)',
            }
        ]
    }

    return (
        <div className="chart">
            <Line data={data} ref={chartRef} />
        </div>
    )
}