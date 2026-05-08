import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeliveryChargeCalculator = ({ shopLat, shopLng, custLat, custLng, onCharge }) => {
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    if (custLat && custLng && shopLat && shopLng) {
      calculateCharge();
    }
  }, [custLat, custLng]);

  const calculateCharge = async () => {
    try {
      const res = await axios.post(
        'http://localhost:8070/api/orders/delivery-charge',
        { shopLat, shopLng, custLat, custLng }
      );
      setBreakdown(res.data);
      onCharge && onCharge(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!breakdown) return null;

  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
      <p className="text-sm font-bold text-blue-700 mb-3">
        🚴 Delivery Charge Breakdown
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">📍 Distance</span>
          <span className="font-medium">{breakdown.distanceKm} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">🏠 Base Fare</span>
          <span className="font-medium">₹{breakdown.baseFare}</span>
        </div>
        {breakdown.distanceKm > breakdown.freeDistance && (
          <div className="flex justify-between">
            <span className="text-gray-600">
              📏 Extra ({(breakdown.distanceKm - breakdown.freeDistance).toFixed(1)} km × ₹{breakdown.pricePerKm})
            </span>
            <span className="font-medium">
              ₹{Math.round((breakdown.distanceKm - breakdown.freeDistance) * breakdown.pricePerKm)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-blue-700 border-t pt-2">
          <span>Total Delivery Charge</span>
          <span>₹{breakdown.deliveryCharge}</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChargeCalculator;