export interface DelhiveryPincodeResponse {
  delivery_codes: {
    postal_code: {
      pincode: number;
      district: string;
      state: string;
      city: string;
      is_oda: string;
      pre_paid: string;
      cash: string;
      pickup: string;
      repl: string;
      cod: string;
    }
  }[];
}

export interface DelhiveryCostResponse {
  total_amount: number;
  status: string;
  // ... more fields if needed
}

export const delhiveryService = {
  checkPincode: async (pincode: string): Promise<DelhiveryPincodeResponse> => {
    const response = await fetch(`/api/delhivery/pincode/${pincode}`);
    if (!response.ok) throw new Error("Failed to check pincode");
    return response.json();
  },

  trackShipment: async (waybill: string, orderId?: string) => {
    const response = await fetch(`/api/delhivery/track/${waybill}${orderId ? `?order_id=${orderId}` : ''}`);
    if (!response.ok) throw new Error("Failed to track shipment");
    return response.json();
  },

  createShipment: async (shipmentData: any) => {
    const response = await fetch('/api/delhivery/shipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shipmentData)
    });
    if (!response.ok) throw new Error("Failed to create shipment");
    return response.json();
  },

  calculateCost: async (d_pin: string, o_pin: string, cgm: number, pt: string): Promise<DelhiveryCostResponse> => {
    const response = await fetch(`/api/delhivery/cost?d_pin=${d_pin}&o_pin=${o_pin}&cgm=${cgm}&pt=${pt}`);
    if (!response.ok) throw new Error("Failed to calculate shipping cost");
    return response.json();
  }
};
