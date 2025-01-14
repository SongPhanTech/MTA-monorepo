import React from 'react'
import './index.css'
import { uniqueId } from 'lodash'

type SkeletonProps = {
    count?: number
    type?: 'normal' | 'card' | 'table'
}

function Skeleton(props: SkeletonProps) {
    const { count = 1, type = 'normal' } = props

    switch (type) {
        case 'card':
            return Array(count)
                .fill(uniqueId())
                .map((key) => (
                    <a
                        className="skeleton_card"
                        id="skeleton-card-link"
                        target="_blank"
                        key={key}
                    >
                        <div className="skeleton_card__header">
                            <div>
                                <img
                                    className="skeleton_card__header header__img skeleton"
                                    id="logo-img"
                                    alt=""
                                />
                            </div>
                            <h3
                                className="skeleton_card__header header__title"
                                id="skeleton-card-title"
                            >
                                <div className="skeleton skeleton-text"></div>
                                <div className="skeleton skeleton-text"></div>
                            </h3>
                        </div>

                        <div className="skeleton_card__body">
                            <div
                                className="skeleton_card__body body__text"
                                id="skeleton-card-details"
                            >
                                <div className="skeleton skeleton-text skeleton-text__body"></div>
                            </div>

                            <div className="skeleton_card__body body__img">
                                <img
                                    className="skeleton"
                                    alt=""
                                    id="cover-img"
                                />
                            </div>
                        </div>

                        <div
                            className="skeleton_card__footer"
                            id="skeleton-card-footer"
                        >
                            <div className="skeleton skeleton-text skeleton-footer"></div>
                        </div>
                    </a>
                ))
        case 'table':
            return (
                <div className="skeleton_table ">
                    <table className="tg w-100">
                        <thead>
                            <tr>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                                <th className="tg-cly1">
                                    <div className="line"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array(count)
                                .fill(uniqueId())
                                .map((key) => (
                                    <tr key={key}>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                        <td className="tg-cly1">
                                            <div className="line"></div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )
        default:
            return (
                <>
                    {Array(count)
                        .fill(uniqueId())
                        .map((key) => (
                            <div
                                key={key}
                                className="skeleton skeleton-text"
                            ></div>
                        ))}
                </>
            )
    }
}

export default Skeleton
