import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (onNewOrder, onNotification) => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('https://smartshop-backend-64zl.onrender.com/ws'),
    onConnect: () => {
      console.log('WebSocket connected!');

      // Subscribe to new orders (delivery boys)
      stompClient.subscribe('/topic/new-orders', (message) => {
        const data = JSON.parse(message.body);
        onNewOrder && onNewOrder(data);
      });

      // Subscribe to shopkeeper notifications
      stompClient.subscribe('/topic/shopkeeper', (message) => {
        const data = JSON.parse(message.body);
        onNotification && onNotification(data);
      });
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
    reconnectDelay: 5000,
  });

  stompClient.activate();
  return stompClient;
};

export const subscribeToCustomer = (customerId, callback) => {
  if (stompClient?.connected) {
    stompClient.subscribe(`/topic/customer/${customerId}`, (message) => {
      callback(JSON.parse(message.body));
    });
  }
};

export const subscribeToDeliveryBoy = (deliveryBoyId, callback) => {
  if (stompClient?.connected) {
    stompClient.subscribe(
      `/topic/delivery-boy/${deliveryBoyId}`,
      (message) => {
        callback(JSON.parse(message.body));
      }
    );
  }
};

export const disconnectWebSocket = () => {
  stompClient?.deactivate();
};