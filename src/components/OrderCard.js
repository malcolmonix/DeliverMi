import React from 'react';

const OrderCard = ({ order, onAccept }) => {
    return (
        <div className="order-card">
            <div className="order-header">
                <h3>{order.restaurant}</h3>
                <span className="order-price">${order.orderAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="order-details">
                <p className="order-address">📍 {order.address}</p>
                <p className="order-items">{order.orderItems?.length} items</p>
            </div>
            <div className="order-actions">
                <button className="accept-btn" onClick={() => onAccept(order.id)}>
                    Accept Order
                </button>
            </div>
        </div>
    );
};

export default OrderCard;
