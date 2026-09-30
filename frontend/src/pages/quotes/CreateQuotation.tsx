import { useState } from 'react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import {
  Eye,
  MoreHorizontal,
  Edit3,
  Plus,
  Send,
  Save,
  Download,
  Share2,
  Copy,
  MoreVertical,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  Link as LinkIcon,
  Calendar,
  Building2,
  FolderKanban,
  Tag,
} from 'lucide-react'

interface QuotationItem {
  id: number
  name: string
  description: string
  qty: number
  unitPrice: number
  discount: number
  tax: number
  amount: number
}

export default function CreateQuotation() {
  const [items] = useState<QuotationItem[]>([
    {
      id: 1,
      name: 'UI/UX Design',
      description: 'User research, wireframes, UI design',
      qty: 1,
      unitPrice: 2500.0,
      discount: 5,
      tax: 18,
      amount: 2375.0,
    },
    {
      id: 2,
      name: 'Front-end Development',
      description: 'HTML, CSS, JavaScript, Responsive',
      qty: 1,
      unitPrice: 4000.0,
      discount: 5,
      tax: 18,
      amount: 3800.0,
    },
    {
      id: 3,
      name: 'Back-end Development',
      description: 'PHP, Laravel, Database Integration',
      qty: 1,
      unitPrice: 3000.0,
      discount: 5,
      tax: 18,
      amount: 2850.0,
    },
    {
      id: 4,
      name: 'Content Management System',
      description: 'CMS Setup & Customization',
      qty: 1,
      unitPrice: 1500.0,
      discount: 0,
      tax: 18,
      amount: 1500.0,
    },
    {
      id: 5,
      name: 'Testing & Deployment',
      description: 'QA Testing, Bug Fixing & Deployment',
      qty: 1,
      unitPrice: 1000.0,
      discount: 0,
      tax: 18,
      amount: 1000.0,
    },
  ])

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Quotes', path: '/quotes' },
          { label: 'New Quotation' },
        ]}
      />

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Create Quotation</h1>
          <p className="page-description">Create and send professional quotations to your customers.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline">
            <Eye size={16} />
            Preview
          </button>
          <button className="btn btn-outline">
            <MoreHorizontal size={16} />
            More Actions
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="layout-2col layout-2col-wide">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Company Info Section */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-gray-100)' }}>
              {/* From Company */}
              <div style={{ padding: 20, borderRight: '1px solid var(--color-gray-100)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-gray-500)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  From (Your Company)
                </div>
                <div className="info-box" style={{ padding: 0 }}>
                  <div className="info-box-icon info-box-icon-blue">
                    <Building2 size={20} />
                  </div>
                  <div className="info-box-content">
                    <div className="info-box-title">Acme Solutions Pvt. Ltd.</div>
                    <div className="info-box-text">
                      123 Business Avenue, Colombo 04,<br />
                      Sri Lanka<br /><br />
                      +94 11 234 5678<br />
                      info@acmesolutions.lk<br />
                      <a href="#">www.acmesolutions.lk</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* To Customer */}
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    To (Customer)
                  </div>
                  <button type="button" className="card-section-edit-btn">
                    <Edit3 size={12} className="edit-btn-icon" />
                    <span>Edit</span>
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-gray-900)', marginBottom: 4 }}>
                    TechNova Inc.
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-gray-500)', lineHeight: 1.7 }}>
                    45 Innovation Drive,<br />
                    Colombo 07, Sri Lanka<br /><br />
                    +94 11 765 4321<br />
                    contact@technova.lk<br />
                    Attention: Mr. Michael Brown
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Details */}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label form-label-regular">Quote Title</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue="Website Redesign & Development"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label form-label-regular">Quote For</label>
                  <select className="form-select">
                    <option>Website Redesign Project</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label form-label-regular">Payment Terms</label>
                  <select className="form-select">
                    <option>30 Days</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label form-label-regular">Delivery Timeline</label>
                  <select className="form-select">
                    <option>4 - 6 Weeks</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label form-label-regular">Sales Person</label>
                  <select className="form-select">
                    <option>John Doe</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>
              <h3 className="card-title">Items</h3>
              <button className="btn btn-primary btn-sm">
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Item & Description</th>
                    <th style={{ width: 60, textAlign: 'center' }}>Qty</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Discount</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Tax</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Amount</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--color-gray-400)' }}>{item.id}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>
                          {item.description}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right' }}>${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>{item.discount}%</td>
                      <td style={{ textAlign: 'center' }}>{item.tax}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--color-gray-900)' }}>
                        ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}>
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Discount */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="form-group" style={{ marginBottom: 0, maxWidth: 400 }}>
                <label className="form-label form-label-regular" style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                  Add Notes to Item
                </label>
                <input
                  type="text"
                  className="form-input"
                  defaultValue="Thank you for the opportunity to provide this quotation."
                />
              </div>
              <button className="btn btn-outline btn-sm">
                <Tag size={14} />
                Add Discount
              </button>
            </div>
          </div>

          {/* Terms & Internal Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Terms & Conditions */}
            <div>
              <h3 className="card-title" style={{ marginBottom: 10 }}>Terms & Conditions</h3>
              <div className="rich-text-editor">
                <div className="rich-text-toolbar">
                  <button className="rich-text-btn"><Bold size={14} /></button>
                  <button className="rich-text-btn"><Italic size={14} /></button>
                  <button className="rich-text-btn"><Underline size={14} /></button>
                  <button className="rich-text-btn"><List size={14} /></button>
                  <button className="rich-text-btn"><ListOrdered size={14} /></button>
                  <button className="rich-text-btn"><AlignLeft size={14} /></button>
                  <button className="rich-text-btn"><LinkIcon size={14} /></button>
                </div>
                <div className="rich-text-content">
                  <ul>
                    <li>This quotation is valid until the expiry date mentioned above.</li>
                    <li>Payment should be made within the agreed payment terms.</li>
                    <li>All prices are in USD and inclusive of applicable taxes.</li>
                    <li>Any additional requirements will be charged separately.</li>
                    <li>Please contact us for any clarifications.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <h3 className="card-title" style={{ marginBottom: 10 }}>Internal Notes</h3>
              <textarea
                className="form-textarea"
                placeholder="Add internal notes here..."
                style={{ minHeight: 155 }}
              />
            </div>
          </div>

          {/* Quote Timeline */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Quote Timeline</h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-title">Quotation created</div>
                  <div className="timeline-description">John Doe created this quotation</div>
                </div>
                <div className="timeline-time">May 18, 2024 10:30 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quote Status */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="data-pair-label">Quote Status</span>
              <span className="badge badge-draft" style={{ padding: '4px 14px', fontWeight: 600 }}>Draft</span>
            </div>

            <div className="data-pair">
              <div className="data-pair-label">Quote Number</div>
              <div className="data-pair-value">QUO-2024-0058</div>
            </div>

            <div className="data-pair">
              <div className="data-pair-label">Quote Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="data-pair-value">May 18, 2024</span>
                <Calendar size={16} style={{ color: 'var(--color-gray-400)' }} />
              </div>
            </div>

            <div className="data-pair">
              <div className="data-pair-label">Valid Until</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="data-pair-value">June 17, 2024</span>
                <Calendar size={16} style={{ color: 'var(--color-gray-400)' }} />
              </div>
            </div>

            <div className="data-pair" style={{ marginBottom: 0 }}>
              <div className="data-pair-label">Currency</div>
              <select className="form-select form-input-sm">
                <option>USD - US Dollar</option>
              </select>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="summary-block">
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">$12,450.00</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Discount</span>
              <span className="summary-value summary-value-success">$1,245.00</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tax (18%)</span>
              <span className="summary-value">$2,016.90</span>
            </div>
            <div className="summary-total">
              <div className="summary-row">
                <span className="summary-label">Total</span>
                <span className="summary-value" style={{ fontSize: 24, fontWeight: 800 }}>$13,221.90</span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 2 }}>
                Total in Words
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-gray-600)', lineHeight: 1.5 }}>
                Thirteen thousand two hundred twenty-one dollars and ninety cents only
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-btn-list">
            <button className="action-btn action-btn-success">
              <Send size={16} />
              Send Quote
            </button>
            <button className="action-btn">
              <Save size={16} />
              Save as Draft
            </button>
            <button className="action-btn">
              <Download size={16} />
              Download PDF
            </button>
            <button className="action-btn">
              <Share2 size={16} />
              Share Link
            </button>
            <button className="action-btn">
              <Copy size={16} />
              Duplicate Quote
            </button>
          </div>

          {/* Related Section */}
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <div className="data-pair-label" style={{ marginBottom: 10 }}>Related</div>
              <div className="related-block">
                <div className="related-icon related-icon-blue">
                  <Building2 size={18} />
                </div>
                <div className="related-info">
                  <div className="related-name">TechNova Inc.</div>
                  <a href="#" className="related-link">View Account</a>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="data-pair-label" style={{ marginBottom: 10 }}>Related Project</div>
              <div className="related-block">
                <div className="related-icon related-icon-purple">
                  <FolderKanban size={18} />
                </div>
                <div className="related-info">
                  <div className="related-name">Website Redesign</div>
                  <a href="#" className="related-link">View Project</a>
                </div>
              </div>
            </div>

            <div>
              <div className="data-pair-label" style={{ marginBottom: 10 }}>Related Contact</div>
              <div className="related-block">
                <div className="related-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                  MB
                </div>
                <div className="related-info">
                  <div className="related-name">Michael Brown</div>
                  <a href="#" className="related-link">View Contact</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
