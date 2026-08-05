const fs = require('fs');
let content = fs.readFileSync('src/views/Orders.jsx', 'utf8');

const startTarget = `{/* Detailed Shipping Checkpoints Stepper */}`;
const endTarget = `{/* Order Placed step */}`;

// Actually, it's safer to replace from `{/* Detailed Shipping Checkpoints Stepper */}` 
// to the closing `</div>` right after `{/* Order Placed step */}` block.

const exactStart = content.indexOf(`{/* Detailed Shipping Checkpoints Stepper */}`);
const exactEnd = content.indexOf(`                        </div>`, content.indexOf(`{/* Order Placed step */}`)) + 30;

if (exactStart !== -1 && exactEnd !== -1) {
  const before = content.substring(0, exactStart);
  const after = content.substring(exactEnd);

  const replacement = `{/* Detailed Shipping Checkpoints Stepper (Dynamic from DB) */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121', marginBottom: '12px' }}>Shipment Checkpoints</div>
                      <div className="tracking-checkpoints-list">
                        {(() => {
                          // Fallback mock history if DB doesn't have it (for legacy orders)
                          let history = order.trackingHistory;
                          if (!history || history.length === 0) {
                            history = [
                              { status: 'Placed', timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), comment: 'Order Placed & Confirmed' }
                            ];
                            if (status === 'Processing' || status === 'Packed' || status === 'In Transit' || status === 'Delivered') {
                              history.unshift({ status: 'Packed', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), comment: 'Package Packed & Secured' });
                            }
                            if (status === 'In Transit' || status === 'Delivered') {
                              history.unshift({ status: 'In Transit', timestamp: new Date(new Date().setDate(new Date().getDate() - 0)).toISOString(), comment: 'Out for Delivery / Reached Hub' });
                            }
                            if (status === 'Delivered') {
                              history.unshift({ status: 'Delivered', timestamp: new Date().toISOString(), comment: 'Delivered Successfully' });
                            }
                          } else {
                            // Sort history descending by timestamp
                            history = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                          }

                          return history.map((event, index) => {
                            const isCompleted = index !== 0 || status === 'Delivered';
                            const isActive = index === 0 && status !== 'Delivered';
                            
                            // Map status to nice titles
                            let title = event.status;
                            if (title === 'Placed' || title === 'Pending') title = 'Order Placed & Confirmed';
                            if (title === 'Processing' || title === 'Packed') title = 'Package Packed & Secured';
                            if (title === 'Shipped' || title === 'In Transit') title = 'In Transit / Sorting Hub';
                            if (title === 'Out for Delivery') title = 'Out for Delivery';
                            if (title === 'Delivered') title = 'Delivered Successfully';
                            
                            return (
                              <div key={index} className={\`tracking-checkpoint-item \${isCompleted ? 'completed' : ''} \${isActive ? 'active' : ''}\`}>
                                <div className="tracking-checkpoint-node"></div>
                                <div className="tracking-checkpoint-title">{title}</div>
                                <div className="tracking-checkpoint-desc">{event.comment || \`Order status updated to \${event.status}\`}{event.location ? \` at \${event.location}\` : ''}</div>
                                <div className="tracking-checkpoint-date">{new Date(event.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>`;

  content = before + replacement + after;
  fs.writeFileSync('src/views/Orders.jsx', content, 'utf8');
  console.log('Orders UI tracking history updated successfully.');
} else {
  console.log('Could not find start or end index for Orders UI replacement.', exactStart, exactEnd);
}
