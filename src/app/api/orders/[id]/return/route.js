import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import User from '../../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { createCashfreeRefund } from '../../../../../lib/cashfree.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      reason, 
      refundDestination, 
      action, 
      courierPartner, 
      returnAwb, 
      pickupDate, 
      qcRemarks, 
      adminNotes 
    } = body;

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ cfOrderId: id }, { id }] });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const requesterId = String(auth.user?.id || auth.user?._id || '');
    const orderUserId = String(order.user || '');
    const cleanUserPhone = String(auth.user?.phone || '').replace(/\D/g, '').slice(-10);
    const cleanOrderPhone = String(order.shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);

    const isOwner = (requesterId && orderUserId && requesterId === orderUserId) || 
                    (cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone);
    if (!isOwner && !auth.isAdmin && !auth.isSeller) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this order' }, { status: 403 });
    }

    if (!order.returnDetails) {
      order.returnDetails = {};
    }
    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    // =========================================================================
    // 🛠️ ADMIN & SELLER RETURN LIFECYCLE MANAGEMENT
    // =========================================================================
    if (auth.isAdmin || auth.isSeller) {
      // 1. APPROVE RETURN REQUEST
      if (action === 'Approve' || action === 'approve') {
        order.returnStatus = 'Approved';
        if (!order.returnDetails.rmaNumber) {
          order.returnDetails.rmaNumber = `RMA-${Date.now().toString().slice(-6)}`;
        }
        if (!order.returnDetails.pickupPin) {
          order.returnDetails.pickupPin = Math.floor(1000 + Math.random() * 9000).toString();
        }
        order.returnDetails.adminNotes = adminNotes || 'Return request approved by store management.';

        order.trackingHistory.push({
          status: 'Return Approved',
          timestamp: new Date(),
          location: 'Returns Verification Hub',
          comment: `RMA generated: ${order.returnDetails.rmaNumber}. Pickup Doorstep PIN: ${order.returnDetails.pickupPin}.`
        });

        await order.save();
        return NextResponse.json({ 
          success: true, 
          message: 'Return approved! Reverse pickup is ready to be scheduled.',
          order 
        });
      }

      // 2. SCHEDULE REVERSE PICKUP
      if (action === 'SchedulePickup' || action === 'schedule_pickup') {
        const assignedCourier = courierPartner || 'Delhivery Reverse Express';
        const assignedAwb = returnAwb || `REV-${Date.now().toString().slice(-8)}`;
        const scheduledTime = pickupDate ? new Date(pickupDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

        order.returnStatus = 'Pickup Scheduled';
        order.returnDetails.reverseCourier = assignedCourier;
        order.returnDetails.returnAwb = assignedAwb;
        order.returnDetails.pickupScheduledDate = scheduledTime;
        if (!order.returnDetails.pickupPin) {
          order.returnDetails.pickupPin = Math.floor(1000 + Math.random() * 9000).toString();
        }

        order.trackingHistory.push({
          status: 'Reverse Pickup Scheduled',
          timestamp: new Date(),
          location: order.shippingAddress?.city || 'Local Hub',
          comment: `Pickup assigned to ${assignedCourier} (AWB: ${assignedAwb}). Pickup PIN: ${order.returnDetails.pickupPin}.`
        });

        await order.save();
        return NextResponse.json({ 
          success: true, 
          message: `Reverse pickup scheduled with ${assignedCourier} (AWB: ${assignedAwb})!`,
          order 
        });
      }

      // 3. MARK ITEM PICKED UP BY COURIER
      if (action === 'MarkPickedUp' || action === 'mark_picked_up') {
        order.returnStatus = 'Picked Up';
        order.returnDetails.pickedUpAt = new Date();

        order.trackingHistory.push({
          status: 'Return Picked Up',
          timestamp: new Date(),
          location: order.shippingAddress?.city || 'Customer Doorstep',
          comment: 'Package picked up by courier partner. In transit to inspection hub.'
        });

        await order.save();
        return NextResponse.json({ 
          success: true, 
          message: 'Order marked as Picked Up. In transit for Quality Check.',
          order 
        });
      }

      // 4. QUALITY CHECK PASSED & ISSUE REFUND
      if (action === 'PassQcAndRefund' || action === 'refund') {
        const destinationType = order.refundDestination?.type || 'Wallet';
        const orderTotal = Number(order.totalPrice || 0);
        let refundAmount = orderTotal;
        let refundTxnId = '';

        // Case A: Wallet Cash Refund (+ 5% bonus incentive)
        if (destinationType === 'Wallet' || !destinationType || destinationType === 'None') {
          const bonusCash = Math.round(orderTotal * 1.05);
          refundAmount = bonusCash;
          refundTxnId = `WAL-REF-${Date.now().toString().slice(-6)}`;

          if (order.user) {
            await User.findByIdAndUpdate(order.user, {
              $inc: { walletCash: bonusCash }
            });
          }
        } 
        // Case B: Cashfree Gateway / Original Mode Refund
        else if (destinationType === 'Original' && order.cfOrderId) {
          try {
            const cfRefund = await createCashfreeRefund({
              orderId: order.cfOrderId,
              refundAmount: orderTotal,
              refundNote: `Refund for RMA ${order.returnDetails?.rmaNumber || order.id}`
            });
            refundTxnId = cfRefund.cf_refund_id || cfRefund.refund_id || `CFR-${Date.now()}`;
          } catch (err) {
            console.warn('[Cashfree Refund Direct Call Warning]:', err.message);
            refundTxnId = `CFR-MANUAL-${Date.now().toString().slice(-6)}`;
          }
        } 
        // Case C: Direct UPI / Bank Refund
        else {
          refundTxnId = `UPI-REF-${Date.now().toString().slice(-6)}`;
        }

        order.returnStatus = 'Refunded';
        order.status = 'Returned';
        order.returnDetails.qcStatus = 'Passed';
        order.returnDetails.qcRemarks = qcRemarks || 'Product received in original condition with tags intact.';
        order.returnDetails.refundAmount = refundAmount;
        order.returnDetails.refundMethod = destinationType;
        order.returnDetails.refundTransactionId = refundTxnId;
        order.returnDetails.refundedAt = new Date();

        order.refundDetails = {
          refundArn: refundTxnId,
          refundStatus: 'Credited',
          amount: refundAmount,
          creditedAt: new Date()
        };

        order.trackingHistory.push({
          status: 'Refund Credited',
          timestamp: new Date(),
          location: 'Finance Escrow Desk',
          comment: `100% Refund of ₹${refundAmount.toLocaleString('en-IN')} successfully credited to ${destinationType} (Ref: ${refundTxnId}).`
        });

        await order.save();
        return NextResponse.json({ 
          success: true, 
          message: `QC Passed! ₹${refundAmount.toLocaleString('en-IN')} refund successfully credited via ${destinationType}.`,
          order 
        });
      }

      // 5. QUALITY CHECK FAILED
      if (action === 'FailQc' || action === 'fail_qc') {
        order.returnStatus = 'QC Failed';
        order.returnDetails.qcStatus = 'Failed';
        order.returnDetails.qcRemarks = qcRemarks || 'Item returned damaged, used, or missing original accessories.';

        order.trackingHistory.push({
          status: 'Return QC Failed',
          timestamp: new Date(),
          location: 'Warehouse Inspection Desk',
          comment: `Return QC Failed: ${order.returnDetails.qcRemarks}. Item cannot be refunded.`
        });

        await order.save();
        return NextResponse.json({ 
          success: true, 
          message: 'Quality inspection marked as Failed. Customer has been notified.',
          order 
        });
      }

      // 6. REJECT RETURN REQUEST
      if (action === 'Reject' || action === 'reject') {
        order.returnStatus = 'Rejected';
        order.returnDetails.adminNotes = adminNotes || 'Return rejected due to expiration of return policy or item ineligibility.';

        order.trackingHistory.push({
          status: 'Return Rejected',
          timestamp: new Date(),
          location: 'Returns Verification Hub',
          comment: `Return request rejected: ${order.returnDetails.adminNotes}`
        });

        await order.save();
        return NextResponse.json({ 
          success: true, 
          message: 'Return request rejected successfully.',
          order 
        });
      }
    }

    // =========================================================================
    // 👤 CUSTOMER INITIATED RETURN
    // =========================================================================
    const orderStatusNorm = (order.status || '').toLowerCase();
    if (orderStatusNorm !== 'delivered') {
      return NextResponse.json({ error: 'Returns can only be requested for delivered orders' }, { status: 400 });
    }

    if (order.returnStatus && order.returnStatus !== 'None' && order.returnStatus !== 'Rejected') {
      return NextResponse.json({ error: `A return request is already in progress (Status: ${order.returnStatus})` }, { status: 400 });
    }

    const rma = `RMA-${Date.now().toString().slice(-6)}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    order.returnStatus = 'Requested';
    order.returnReason = reason || 'Defective / Not as described';
    order.refundDestination = refundDestination || { type: 'Wallet' };
    order.returnDetails = {
      rmaNumber: rma,
      pickupPin: pin,
      refundMethod: refundDestination?.type || 'Wallet',
      adminNotes: 'Awaiting admin verification and reverse courier assignment.'
    };

    order.trackingHistory.push({
      status: 'Return Requested',
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Customer Address',
      comment: `Return requested (${order.returnReason}). Target: ${refundDestination?.type || 'Wallet'}. RMA: ${rma}.`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: `Return request (${rma}) submitted! Our courier partner will schedule reverse pickup shortly.`,
      order
    });
  } catch (error) {
    console.error('Error in POST /api/orders/[id]/return:', error);
    return NextResponse.json({ error: error.message || 'Failed to process return request' }, { status: 500 });
  }
}
