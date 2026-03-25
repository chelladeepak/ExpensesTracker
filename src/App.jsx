import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'salary-tracker-one-year'
const ADMIN_PIN = '1234'
const DEFAULT_COMPANY_NAME = 'Your Company Name'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const monthFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  year: 'numeric',
})

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const today = () => new Date().toISOString().slice(0, 10)

const emptyPersonForm = {
  name: '',
  role: '',
  monthlySalary: '',
}

const EXPENSE_ITEMS = [
  { category: 'Gas & Fuel', item: 'Gas Cylinder', defaultUnit: 'cylinder' },
  { category: 'Ghee/OIL', item: 'Ghee', defaultUnit: 'kg' },
  { category: 'Ghee/OIL', item: 'Oil', defaultUnit: 'litre' },
  { category: 'Water', item: 'Water Can', defaultUnit: 'can' },
  { category: 'Water', item: 'Water Bottles', defaultUnit: 'bottle' },
  { category: 'Utensils / Packing', item: 'Plates', defaultUnit: 'pcs' },
  { category: 'Utensils / Packing', item: 'Spoons', defaultUnit: 'pcs' },
  { category: 'Utensils / Packing', item: 'Covers', defaultUnit: 'pcs' },
  { category: 'Utensils / Packing', item: 'Dustbin Covers', defaultUnit: 'pcs' },
  { category: 'Utensils / Packing', item: 'Parcel Boxes', defaultUnit: 'box' },
  { category: 'Transport', item: 'Auto Charges', defaultUnit: 'trip' },
  { category: 'Billing', item: 'Billing Roll', defaultUnit: 'roll' },
  { category: 'Cleaning Supplies', item: 'Dishwasher Liquid', defaultUnit: 'litre' },
  { category: 'Cleaning Supplies', item: 'Scrubbers', defaultUnit: 'pcs' },
  { category: 'Pulses, Grains, Flour', item: 'Minapa Gullu', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Senagapappu', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Kandipappu', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Dosa Rice', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Idly Rava', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Upma Rava', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Poha', defaultUnit: 'kg' },
  { category: 'Pulses, Grains, Flour', item: 'Maida', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Red Mirchi', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Tamarind', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Jeera', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Daniyalu', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Salt', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Avalu', defaultUnit: 'kg' },
  { category: 'Spices & Condiments', item: 'Chicken Masala', defaultUnit: 'kg' },
  { category: 'Dry Fruits & Nuts', item: 'Groundnuts', defaultUnit: 'kg' },
  { category: 'Dry Fruits & Nuts', item: 'Cashew', defaultUnit: 'kg' },
  { category: 'Other Essentials', item: 'Garlic', defaultUnit: 'kg' },
  { category: 'Other Essentials', item: 'Ginger', defaultUnit: 'kg' },
  { category: 'Other Essentials', item: 'Bellam (Jaggery)', defaultUnit: 'kg' },
  { category: 'Other Essentials', item: 'Sugar', defaultUnit: 'kg' },
  { category: 'Other Essentials', item: 'Baking Soda', defaultUnit: 'kg' },
]

const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Bank Transfer', 'Credit', 'Pending']
const INCOME_SOURCES = ['Cash', 'UPI', 'Swiggy', 'Zomato']
const UNIT_OPTIONS = ['kg', 'gram', 'litre', 'ml', 'pcs', 'box', 'roll', 'can', 'bottle', 'cylinder', 'trip']

const EXPENSE_ITEM_GROUPS = EXPENSE_ITEMS.reduce((groups, option) => {
  if (!groups[option.category]) {
    groups[option.category] = []
  }

  groups[option.category].push(option)
  return groups
}, {})

const createTransactionForm = (personId = '') => ({
  personId,
  type: 'salary',
  amount: '',
  date: today(),
  note: '',
})

const createExpenseForm = (itemName = '') => {
  const expenseOption = EXPENSE_ITEMS.find((option) => option.item === itemName)

  return {
    category: expenseOption?.category ?? '',
    item: expenseOption?.item ?? '',
    unit: expenseOption?.defaultUnit ?? 'kg',
    qty: '',
    rate: '',
    amount: '',
    payment: '',
    date: today(),
    note: '',
  }
}

const createIncomeForm = () => ({
  source: 'Cash',
  amount: '',
  date: today(),
  note: '',
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

function formatDateLabel(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dayFormatter.format(date)
}

function escapePdfText(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

function normalizePdfText(value) {
  return String(value).replaceAll('₹', 'Rs. ')
}

function createPdfText({ x, y, text, size = 12, font = 'F1', color = '0.176 0.114 0.075' }) {
  return [
    'BT',
    `${color} rg`,
    `/${font} ${size} Tf`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${escapePdfText(normalizePdfText(text))}) Tj`,
    'ET',
  ].join('\n')
}

function createFilledRect({ x, y, width, height, color }) {
  return [`${color} rg`, `${x} ${y} ${width} ${height} re`, 'f'].join('\n')
}

function createStrokeRect({ x, y, width, height, color = '0.82 0.68 0.50', lineWidth = 1 }) {
  return [`${lineWidth} w`, `${color} RG`, `${x} ${y} ${width} ${height} re`, 'S'].join('\n')
}

function createPayslipPdfBlob(fileName, company, rows) {
  const safeRows = rows.filter(([label, value]) => label && value !== undefined)
  const pageWidth = 595
  const startX = 50
  const tableWidth = pageWidth - startX * 2
  const labelWidth = 180
  const valueWidth = tableWidth - labelWidth
  const rowHeight = 30
  const headerHeight = 34
  let currentY = 760
  const normalizedCompany = normalizePdfText(company)
  const companyTextX = Math.max(startX + 16, startX + tableWidth / 2 - normalizedCompany.length * 4.2)

  const streamParts = []

  streamParts.push(
    createFilledRect({
      x: startX,
      y: currentY,
      width: tableWidth,
      height: headerHeight,
      color: '1 0.98 0.863',
    }),
  )
  streamParts.push(createStrokeRect({ x: startX, y: currentY, width: tableWidth, height: headerHeight }))
  streamParts.push(
    createPdfText({
      x: companyTextX,
      y: currentY + 11,
      text: normalizedCompany,
      size: 15,
      font: 'F2',
      color: '0.537 0.227 0.024',
    }),
  )
  currentY -= headerHeight

  streamParts.push(
    createFilledRect({
      x: startX,
      y: currentY,
      width: tableWidth,
      height: headerHeight,
      color: '0.686 0.298 0.059',
    }),
  )
  streamParts.push(createStrokeRect({ x: startX, y: currentY, width: tableWidth, height: headerHeight }))
  streamParts.push(
    createPdfText({
      x: startX + tableWidth / 2 - 34,
      y: currentY + 11,
      text: 'PAY SLIP',
      size: 14,
      font: 'F2',
      color: '1 1 1',
    }),
  )
  currentY -= headerHeight

  safeRows.forEach(([label, value], index) => {
    const fillColor = index % 2 === 0 ? '1 1 1' : '1 0.98 0.92'

    streamParts.push(createFilledRect({ x: startX, y: currentY, width: labelWidth, height: rowHeight, color: fillColor }))
    streamParts.push(createFilledRect({ x: startX + labelWidth, y: currentY, width: valueWidth, height: rowHeight, color: fillColor }))
    streamParts.push(createStrokeRect({ x: startX, y: currentY, width: labelWidth, height: rowHeight }))
    streamParts.push(createStrokeRect({ x: startX + labelWidth, y: currentY, width: valueWidth, height: rowHeight }))
    streamParts.push(
      createPdfText({
        x: startX + 12,
        y: currentY + 10,
        text: String(label),
        size: 11,
        font: 'F2',
      }),
    )
    streamParts.push(
      createPdfText({
        x: startX + labelWidth + 12,
        y: currentY + 10,
        text: String(value),
        size: 11,
        color: '0.537 0.227 0.024',
      }),
    )

    currentY -= rowHeight
  })

  const stream = streamParts.join('\n')
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object) => {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new File([new TextEncoder().encode(pdf)], `${fileName}.pdf`, { type: 'application/pdf' })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function createExcelBlob(rows) {
  const [headerRow = [], ...bodyRows] = rows
  const tableHeader = headerRow.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')
  const tableBody = bodyRows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')

  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Report</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #c9a27b; padding: 8px; text-align: left; }
          th { background: #fffadc; color: #af4c0f; font-weight: 700; }
        </style>
      </head>
      <body>
        <table>
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableBody}</tbody>
        </table>
      </body>
    </html>
  `

  return new Blob([`\uFEFF${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8;' })
}

function downloadExcelFile(fileName, rows) {
  const file = createExcelBlob(rows)
  const fileUrl = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = `${fileName}.xls`
  link.click()
  URL.revokeObjectURL(fileUrl)
}

function getEntryTime(entry) {
  return new Date(entry.date || entry.createdAt || 0).getTime()
}

function getRemainingDays(dateString) {
  const expiryTime = new Date(dateString).getTime() + ONE_YEAR_MS
  if (!Number.isFinite(expiryTime)) return 0
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)))
}

function getExpiryDate(dateString) {
  const baseTime = new Date(dateString).getTime()
  if (!Number.isFinite(baseTime)) return 'N/A'
  return dayFormatter.format(new Date(baseTime + ONE_YEAR_MS))
}

function isSameMonth(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function isTodayDate(dateString) {
  return dateString === today()
}

function getMonthValue(dateString) {
  return String(dateString || '').slice(0, 7)
}

function getYearValue(dateString) {
  return String(dateString || '').slice(0, 4)
}

function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return { persons: [], entries: [], expenses: [], incomes: [], companyName: DEFAULT_COMPANY_NAME }
    }

    const parsed = JSON.parse(raw)
    return pruneData(parsed)
  } catch {
    return { persons: [], entries: [], expenses: [], incomes: [], companyName: DEFAULT_COMPANY_NAME }
  }
}

function pruneData(data) {
  const cutoff = Date.now() - ONE_YEAR_MS
  const persons = Array.isArray(data?.persons) ? data.persons : []
  const entries = Array.isArray(data?.entries)
    ? data.entries.filter((entry) => {
        const entryTime = getEntryTime(entry)
        return Number.isFinite(entryTime) && entryTime >= cutoff
      })
    : []
  const expenses = Array.isArray(data?.expenses)
    ? data.expenses.filter((expense) => {
        const expenseTime = getEntryTime(expense)
        return Number.isFinite(expenseTime) && expenseTime >= cutoff
      })
    : []
  const incomes = Array.isArray(data?.incomes)
    ? data.incomes.filter((income) => {
        const incomeTime = getEntryTime(income)
        return Number.isFinite(incomeTime) && incomeTime >= cutoff
      })
    : []

  const validPersonIds = new Set(persons.map((person) => person.id))

  return {
    companyName: typeof data?.companyName === 'string' && data.companyName.trim()
      ? data.companyName.trim()
      : DEFAULT_COMPANY_NAME,
    persons,
    entries: entries.filter((entry) => validPersonIds.has(entry.personId)),
    expenses,
    incomes,
  }
}

function getLastTwelveMonths(entries) {
  const months = []
  const now = new Date()

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    months.push({
      key,
      label: monthFormatter.format(date),
      salary: 0,
      advance: 0,
    })
  }

  const monthMap = new Map(months.map((month) => [month.key, month]))

  entries.forEach((entry) => {
    const entryDate = new Date(entry.date)
    if (Number.isNaN(entryDate.getTime())) return

    const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`
    const month = monthMap.get(key)
    if (!month) return

    month[entry.type] += Number(entry.amount) || 0
  })

  return months
}

function getMonthsForYear(entries, yearString) {
  const year = Number(yearString) || new Date().getFullYear()
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1)

    return {
      key: `${year}-${String(index + 1).padStart(2, '0')}`,
      label: monthFormatter.format(date),
      salary: 0,
      advance: 0,
    }
  })

  const monthMap = new Map(months.map((month) => [month.key, month]))

  entries.forEach((entry) => {
    const entryDate = new Date(entry.date)
    if (Number.isNaN(entryDate.getTime()) || entryDate.getFullYear() !== year) return

    const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`
    const month = monthMap.get(key)
    if (!month) return

    month[entry.type] += Number(entry.amount) || 0
  })

  return months
}

function filterEntriesByOverview(entries, filterMode, monthValue, yearValue) {
  return entries.filter((entry) => {
    if (filterMode === 'month') return getMonthValue(entry.date) === monthValue
    return getYearValue(entry.date) === yearValue
  })
}

function App() {
  const storedData = useMemo(() => loadStoredData(), [])
  const [persons, setPersons] = useState(storedData.persons)
  const [entries, setEntries] = useState(storedData.entries)
  const [expenses, setExpenses] = useState(storedData.expenses)
  const [incomes, setIncomes] = useState(storedData.incomes)
  const [companyName, setCompanyName] = useState(storedData.companyName)
  const [activeTab, setActiveTab] = useState('manage')
  const [selectedPersonId, setSelectedPersonId] = useState(storedData.persons[0]?.id ?? '')
  const [personForm, setPersonForm] = useState(emptyPersonForm)
  const [entryForm, setEntryForm] = useState(createTransactionForm(storedData.persons[0]?.id ?? ''))
  const [expenseForm, setExpenseForm] = useState(createExpenseForm())
  const [incomeForm, setIncomeForm] = useState(createIncomeForm())
  const [selectedExpenseDate, setSelectedExpenseDate] = useState(today())
  const [selectedIncomeDate, setSelectedIncomeDate] = useState(today())
  const [selectedIncomeMonth, setSelectedIncomeMonth] = useState(today().slice(0, 7))
  const [itemSummaryFilter, setItemSummaryFilter] = useState('all')
  const [itemSummaryDate, setItemSummaryDate] = useState(today())
  const [itemSummaryMonth, setItemSummaryMonth] = useState(today().slice(0, 7))
  const [analyticsRange, setAnalyticsRange] = useState('day')
  const [analyticsDay, setAnalyticsDay] = useState(today())
  const [analyticsMonth, setAnalyticsMonth] = useState(today().slice(0, 7))
  const [analyticsYear, setAnalyticsYear] = useState(String(new Date().getFullYear()))
  const [adminDateTableMonth, setAdminDateTableMonth] = useState(today().slice(0, 7))
  const [overviewFilterMode, setOverviewFilterMode] = useState('year')
  const [overviewMonth, setOverviewMonth] = useState(today().slice(0, 7))
  const [overviewYear, setOverviewYear] = useState(String(new Date().getFullYear()))
  const [adminPin, setAdminPin] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [pathname, setPathname] = useState(() => window.location.pathname)

  const isAdminRoute = pathname.toLowerCase().startsWith('/admin')

  function syncFromStorage() {
    const latest = loadStoredData()
    setPersons(latest.persons)
    setEntries(latest.entries)
    setExpenses(latest.expenses)
    setIncomes(latest.incomes)
    setCompanyName(latest.companyName)
  }

  useEffect(() => {
    const handleNavigation = () => {
      const nextPathname = window.location.pathname
      setPathname(nextPathname)

      if (!nextPathname.toLowerCase().startsWith('/admin')) {
        setAdminUnlocked(false)
        setAdminPin('')
        setActiveTab((current) => (
          current === 'admin-tracking' || current === 'admin-expenses' || current === 'admin-analytics'
            ? 'overview'
            : current
        ))
      }
    }

    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key && event.key !== STORAGE_KEY) return
      syncFromStorage()
    }

    const handleWindowFocus = () => {
      syncFromStorage()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorage()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const cleaned = pruneData({ companyName, persons, entries, expenses, incomes })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  }, [companyName, persons, entries, expenses, incomes])

  const normalizedSelectedPersonId = persons.some((person) => person.id === selectedPersonId)
    ? selectedPersonId
    : persons[0]?.id ?? ''

  const selectedPerson = persons.find((person) => person.id === normalizedSelectedPersonId) ?? null

  const overviewPeriodLabel = useMemo(() => {
    if (overviewFilterMode === 'month') {
      const monthDate = new Date(`${overviewMonth}-01`)
      return Number.isNaN(monthDate.getTime()) ? overviewMonth : monthFormatter.format(monthDate)
    }

    return overviewYear
  }, [overviewFilterMode, overviewMonth, overviewYear])

  const overviewEntries = useMemo(() => {
    return filterEntriesByOverview(entries, overviewFilterMode, overviewMonth, overviewYear)
  }, [entries, overviewFilterMode, overviewMonth, overviewYear])

  const personEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.personId === normalizedSelectedPersonId)
      .sort((left, right) => new Date(right.date) - new Date(left.date))
  }, [entries, normalizedSelectedPersonId])

  const personStats = useMemo(() => {
    return personEntries.reduce(
      (totals, entry) => {
        const amount = Number(entry.amount) || 0
        totals[entry.type] += amount
        totals.total += amount
        return totals
      },
      { salary: 0, advance: 0, total: 0 },
    )
  }, [personEntries])

  const balanceAmount = Math.max(
    0,
    (Number(selectedPerson?.monthlySalary) || 0) - (personStats.salary + personStats.advance),
  )

  const overviewPersonEntries = useMemo(() => {
    return overviewEntries
      .filter((entry) => entry.personId === normalizedSelectedPersonId)
      .sort((left, right) => new Date(right.date) - new Date(left.date))
  }, [normalizedSelectedPersonId, overviewEntries])

  const overviewPersonStats = useMemo(() => {
    return overviewPersonEntries.reduce(
      (totals, entry) => {
        const amount = Number(entry.amount) || 0
        totals[entry.type] += amount
        totals.total += amount
        return totals
      },
      { salary: 0, advance: 0, total: 0 },
    )
  }, [overviewPersonEntries])

  const overviewBalanceAmount = Math.max(
    0,
    (Number(selectedPerson?.monthlySalary) || 0) - (overviewPersonStats.salary + overviewPersonStats.advance),
  )

  const overviewNextExpiryEntry = overviewPersonEntries.length
    ? [...overviewPersonEntries].sort((left, right) => getEntryTime(left) - getEntryTime(right))[0]
    : null

  const overviewBreakdown = useMemo(() => {
    if (!selectedPerson) return []

    if (overviewFilterMode === 'month') {
      return [
        {
          key: overviewMonth,
          label: overviewPeriodLabel,
          salary: overviewPersonStats.salary,
          advance: overviewPersonStats.advance,
          total: overviewPersonStats.total,
          balance: overviewBalanceAmount,
        },
      ]
    }

    return getMonthsForYear(overviewPersonEntries, overviewYear).map((month) => ({
      ...month,
      total: month.salary + month.advance,
      balance: Math.max(0, (Number(selectedPerson.monthlySalary) || 0) - month.salary - month.advance),
    }))
  }, [
    overviewBalanceAmount,
    overviewFilterMode,
    overviewMonth,
    overviewPeriodLabel,
    overviewPersonEntries,
    overviewPersonStats.advance,
    overviewPersonStats.salary,
    overviewPersonStats.total,
    overviewYear,
    selectedPerson,
  ])

  const allPeopleStats = useMemo(() => {
    return persons.map((person) => {
      const records = entries.filter((entry) => entry.personId === person.id)
      const totals = records.reduce(
        (summary, entry) => {
          summary[entry.type] += Number(entry.amount) || 0
          return summary
        },
        { salary: 0, advance: 0 },
      )

      return {
        ...person,
        recordsCount: records.length,
        salary: totals.salary,
        advance: totals.advance,
        balance: Math.max(0, (Number(person.monthlySalary) || 0) - (totals.salary + totals.advance)),
      }
    })
  }, [entries, persons])

  const overviewPeopleStats = useMemo(() => {
    return persons
      .map((person) => {
        const records = overviewEntries.filter((entry) => entry.personId === person.id)
        const totals = records.reduce(
          (summary, entry) => {
            summary[entry.type] += Number(entry.amount) || 0
            return summary
          },
          { salary: 0, advance: 0 },
        )

        return {
          ...person,
          recordsCount: records.length,
          salary: totals.salary,
          advance: totals.advance,
          balance: Math.max(0, (Number(person.monthlySalary) || 0) - (totals.salary + totals.advance)),
        }
      })
      .sort((left, right) => right.salary + right.advance - (left.salary + left.advance))
  }, [overviewEntries, persons])

  const adminTotals = useMemo(() => {
    return entries.reduce(
      (totals, entry) => {
        const amount = Number(entry.amount) || 0
        if (entry.type === 'salary') totals.salaryOutgoing += amount
        if (entry.type === 'advance') totals.advanceOutgoing += amount
        totals.totalOutgoing += amount
        if (isSameMonth(entry.date)) totals.currentMonthOutgoing += amount
        return totals
      },
      {
        salaryOutgoing: 0,
        advanceOutgoing: 0,
        totalOutgoing: 0,
        currentMonthOutgoing: 0,
      },
    )
  }, [entries])

  const monthlyPayrollCommitment = useMemo(() => {
    return persons.reduce((total, person) => total + (Number(person.monthlySalary) || 0), 0)
  }, [persons])

  const adminMonthlyOverview = useMemo(() => {
    return getLastTwelveMonths(entries).map((month) => ({
      ...month,
      total: month.salary + month.advance,
      remaining: Math.max(0, monthlyPayrollCommitment - (month.salary + month.advance)),
    }))
  }, [entries, monthlyPayrollCommitment])

  const currentMonthRemaining = Math.max(
    0,
    monthlyPayrollCommitment - adminTotals.currentMonthOutgoing,
  )

  const expenseEntries = useMemo(() => {
    return [...expenses].sort((left, right) => {
      const dateDiff = new Date(right.date) - new Date(left.date)
      if (dateDiff !== 0) return dateDiff
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
    })
  }, [expenses])

  const incomeEntries = useMemo(() => {
    return [...incomes].sort((left, right) => {
      const dateDiff = new Date(right.date) - new Date(left.date)
      if (dateDiff !== 0) return dateDiff
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
    })
  }, [incomes])

  const selectedDateExpenses = useMemo(() => {
    return expenseEntries.filter((expense) => expense.date === selectedExpenseDate)
  }, [expenseEntries, selectedExpenseDate])

  const selectedDateIncomes = useMemo(() => {
    return incomeEntries.filter((income) => income.date === selectedIncomeDate)
  }, [incomeEntries, selectedIncomeDate])

  const selectedMonthIncomes = useMemo(() => {
    return incomeEntries.filter((income) => getMonthValue(income.date) === selectedIncomeMonth)
  }, [incomeEntries, selectedIncomeMonth])

  const expenseTotals = useMemo(() => {
    return expenseEntries.reduce(
      (totals, expense) => {
        const amount = Number(expense.amount) || 0
        totals.total += amount
        if (isTodayDate(expense.date)) totals.today += amount
        if (isSameMonth(expense.date)) totals.currentMonth += amount
        totals.categories.add(expense.category)
        return totals
      },
      {
        total: 0,
        today: 0,
        currentMonth: 0,
        categories: new Set(),
      },
    )
  }, [expenseEntries])

  const incomeTotals = useMemo(() => {
    return incomeEntries.reduce(
      (totals, income) => {
        const amount = Number(income.amount) || 0
        totals.total += amount
        if (isTodayDate(income.date)) totals.today += amount
        if (isSameMonth(income.date)) totals.currentMonth += amount
        totals.sources.add(income.source)
        return totals
      },
      {
        total: 0,
        today: 0,
        currentMonth: 0,
        sources: new Set(),
      },
    )
  }, [incomeEntries])

  const selectedExpenseDayTotal = useMemo(() => {
    return selectedDateExpenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0)
  }, [selectedDateExpenses])

  const selectedIncomeDayTotal = useMemo(() => {
    return selectedDateIncomes.reduce((total, income) => total + (Number(income.amount) || 0), 0)
  }, [selectedDateIncomes])

  const selectedIncomeMonthTotal = useMemo(() => {
    return selectedMonthIncomes.reduce((total, income) => total + (Number(income.amount) || 0), 0)
  }, [selectedMonthIncomes])

  const analyticsPeriodLabel = useMemo(() => {
    if (analyticsRange === 'day') {
      return formatDateLabel(analyticsDay)
    }

    if (analyticsRange === 'month') {
      const monthDate = new Date(`${analyticsMonth}-01`)
      return Number.isNaN(monthDate.getTime()) ? analyticsMonth : monthFormatter.format(monthDate)
    }

    return analyticsYear
  }, [analyticsDay, analyticsMonth, analyticsRange, analyticsYear])

  const analyticsEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (analyticsRange === 'day') return entry.date === analyticsDay
      if (analyticsRange === 'month') return getMonthValue(entry.date) === analyticsMonth
      return getYearValue(entry.date) === analyticsYear
    })
  }, [analyticsDay, analyticsMonth, analyticsRange, analyticsYear, entries])

  const analyticsExpenses = useMemo(() => {
    return expenseEntries.filter((expense) => {
      if (analyticsRange === 'day') return expense.date === analyticsDay
      if (analyticsRange === 'month') return getMonthValue(expense.date) === analyticsMonth
      return getYearValue(expense.date) === analyticsYear
    })
  }, [analyticsDay, analyticsMonth, analyticsRange, analyticsYear, expenseEntries])

  const analyticsIncomes = useMemo(() => {
    return incomeEntries.filter((income) => {
      if (analyticsRange === 'day') return income.date === analyticsDay
      if (analyticsRange === 'month') return getMonthValue(income.date) === analyticsMonth
      return getYearValue(income.date) === analyticsYear
    })
  }, [analyticsDay, analyticsMonth, analyticsRange, analyticsYear, incomeEntries])

  const analyticsSalarySummary = useMemo(() => {
    return analyticsEntries.reduce(
      (totals, entry) => {
        const amount = Number(entry.amount) || 0
        totals.records += 1
        totals[entry.type] += amount
        totals.total += amount
        return totals
      },
      { salary: 0, advance: 0, total: 0, records: 0 },
    )
  }, [analyticsEntries])

  const analyticsExpenseSummary = useMemo(() => {
    return analyticsExpenses.reduce(
      (totals, expense) => {
        totals.total += Number(expense.amount) || 0
        totals.records += 1
        totals.categories.add(expense.category)
        return totals
      },
      { total: 0, records: 0, categories: new Set() },
    )
  }, [analyticsExpenses])

  const analyticsIncomeSummary = useMemo(() => {
    return analyticsIncomes.reduce(
      (totals, income) => {
        totals.total += Number(income.amount) || 0
        totals.records += 1
        totals.sources.add(income.source)
        return totals
      },
      { total: 0, records: 0, sources: new Set() },
    )
  }, [analyticsIncomes])

  const analyticsNetBalance = useMemo(() => {
    return analyticsIncomeSummary.total - analyticsExpenseSummary.total - analyticsSalarySummary.total
  }, [analyticsExpenseSummary.total, analyticsIncomeSummary.total, analyticsSalarySummary.total])

  const analyticsPersonSalaryStats = useMemo(() => {
    const personMap = new Map()

    analyticsEntries.forEach((entry) => {
      const person = persons.find((item) => item.id === entry.personId)
      const name = person?.name || 'Unknown person'

      if (!personMap.has(entry.personId)) {
        personMap.set(entry.personId, {
          personId: entry.personId,
          name,
          role: person?.role || 'Employee',
          salary: 0,
          advance: 0,
          total: 0,
          records: 0,
        })
      }

      const summary = personMap.get(entry.personId)
      const amount = Number(entry.amount) || 0
      summary[entry.type] += amount
      summary.total += amount
      summary.records += 1
    })

    return [...personMap.values()].sort((left, right) => right.total - left.total)
  }, [analyticsEntries, persons])

  const analyticsExpenseCategoryStats = useMemo(() => {
    const categoryMap = new Map()

    analyticsExpenses.forEach((expense) => {
      if (!categoryMap.has(expense.category)) {
        categoryMap.set(expense.category, {
          category: expense.category,
          total: 0,
          records: 0,
        })
      }

      const summary = categoryMap.get(expense.category)
      summary.total += Number(expense.amount) || 0
      summary.records += 1
    })

    return [...categoryMap.values()].sort((left, right) => right.total - left.total)
  }, [analyticsExpenses])

  const analyticsIncomeSourceStats = useMemo(() => {
    const sourceMap = new Map()

    analyticsIncomes.forEach((income) => {
      if (!sourceMap.has(income.source)) {
        sourceMap.set(income.source, {
          source: income.source,
          total: 0,
          records: 0,
        })
      }

      const summary = sourceMap.get(income.source)
      summary.total += Number(income.amount) || 0
      summary.records += 1
    })

    return [...sourceMap.values()].sort((left, right) => right.total - left.total)
  }, [analyticsIncomes])

  const adminAnalyticsRows = useMemo(() => {
    return [
      ['Section', 'Metric', 'Value'],
      ['Analytics', 'Period', analyticsPeriodLabel],
      ['Salary', 'Salary paid', analyticsSalarySummary.salary],
      ['Salary', 'Advance paid', analyticsSalarySummary.advance],
      ['Salary', 'Total outgoing', analyticsSalarySummary.total],
      ['Salary', 'Records', analyticsSalarySummary.records],
      ['Expenses', 'Total expense', analyticsExpenseSummary.total],
      ['Expenses', 'Records', analyticsExpenseSummary.records],
      ['Expenses', 'Categories', analyticsExpenseSummary.categories.size],
      ['Income', 'Total income', analyticsIncomeSummary.total],
      ['Income', 'Records', analyticsIncomeSummary.records],
      ['Income', 'Sources', analyticsIncomeSummary.sources.size],
      ['Net', 'Net balance', analyticsNetBalance],
    ]
  }, [
    analyticsExpenseSummary.categories.size,
    analyticsExpenseSummary.records,
    analyticsExpenseSummary.total,
    analyticsIncomeSummary.records,
    analyticsIncomeSummary.sources.size,
    analyticsIncomeSummary.total,
    analyticsNetBalance,
    analyticsPeriodLabel,
    analyticsSalarySummary.advance,
    analyticsSalarySummary.records,
    analyticsSalarySummary.salary,
    analyticsSalarySummary.total,
  ])

  const incomeSourceStats = useMemo(() => {
    const sourceMap = new Map()

    incomeEntries.forEach((income) => {
      if (!sourceMap.has(income.source)) {
        sourceMap.set(income.source, {
          source: income.source,
          totalAmount: 0,
          recordsCount: 0,
          lastDate: income.date,
        })
      }

      const sourceSummary = sourceMap.get(income.source)
      sourceSummary.totalAmount += Number(income.amount) || 0
      sourceSummary.recordsCount += 1
      sourceSummary.lastDate = new Date(income.date) > new Date(sourceSummary.lastDate)
        ? income.date
        : sourceSummary.lastDate
    })

    return [...sourceMap.values()].sort((left, right) => right.totalAmount - left.totalAmount)
  }, [incomeEntries])

  const selectedMonthIncomeSourceStats = useMemo(() => {
    const sourceMap = new Map()

    selectedMonthIncomes.forEach((income) => {
      if (!sourceMap.has(income.source)) {
        sourceMap.set(income.source, {
          source: income.source,
          totalAmount: 0,
          recordsCount: 0,
          lastDate: income.date,
        })
      }

      const sourceSummary = sourceMap.get(income.source)
      sourceSummary.totalAmount += Number(income.amount) || 0
      sourceSummary.recordsCount += 1
      sourceSummary.lastDate = new Date(income.date) > new Date(sourceSummary.lastDate)
        ? income.date
        : sourceSummary.lastDate
    })

    return [...sourceMap.values()].sort((left, right) => right.totalAmount - left.totalAmount)
  }, [selectedMonthIncomes])

  const filteredItemSummaryExpenses = useMemo(() => {
    if (itemSummaryFilter === 'day') {
      return expenseEntries.filter((expense) => expense.date === itemSummaryDate)
    }

    if (itemSummaryFilter === 'month') {
      return expenseEntries.filter((expense) => getMonthValue(expense.date) === itemSummaryMonth)
    }

    return expenseEntries
  }, [expenseEntries, itemSummaryDate, itemSummaryFilter, itemSummaryMonth])

  const filteredItemSummaryTotals = useMemo(() => {
    return filteredItemSummaryExpenses.reduce(
      (totals, expense) => {
        totals.total += Number(expense.amount) || 0
        totals.items.add(expense.item)
        totals.categories.add(expense.category)
        return totals
      },
      {
        total: 0,
        items: new Set(),
        categories: new Set(),
      },
    )
  }, [filteredItemSummaryExpenses])

  const itemWiseSummaryRangeLabel = useMemo(() => {
    if (itemSummaryFilter === 'day') {
      return formatDateLabel(itemSummaryDate)
    }

    if (itemSummaryFilter === 'month') {
      const monthDate = new Date(`${itemSummaryMonth}-01`)
      return Number.isNaN(monthDate.getTime()) ? itemSummaryMonth : monthFormatter.format(monthDate)
    }

    return 'Last 1 year'
  }, [itemSummaryDate, itemSummaryFilter, itemSummaryMonth])

  const itemWiseExpenseStats = useMemo(() => {
    const itemMap = new Map()

    filteredItemSummaryExpenses.forEach((expense) => {
      const key = `${expense.category}::${expense.item}::${expense.unit || 'qty'}`
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          category: expense.category,
          item: expense.item,
          unit: expense.unit || 'qty',
          totalQty: 0,
          totalAmount: 0,
          recordsCount: 0,
          lastDate: expense.date,
          payments: new Set(),
        })
      }

      const itemSummary = itemMap.get(key)
      itemSummary.totalQty += Number(expense.qty) || 0
      itemSummary.totalAmount += Number(expense.amount) || 0
      itemSummary.recordsCount += 1
      itemSummary.lastDate = new Date(expense.date) > new Date(itemSummary.lastDate)
        ? expense.date
        : itemSummary.lastDate

      if (expense.payment) {
        itemSummary.payments.add(expense.payment)
      }
    })

    return [...itemMap.values()]
      .map((itemSummary) => ({
        ...itemSummary,
        averageRate: itemSummary.totalQty > 0 ? itemSummary.totalAmount / itemSummary.totalQty : 0,
        paymentModes: [...itemSummary.payments].join(', ') || 'N/A',
      }))
      .sort((left, right) => right.totalAmount - left.totalAmount)
  }, [filteredItemSummaryExpenses])

  const selectedExpenseDayRows = useMemo(() => {
    return [
      ['Date', 'Category', 'Item', 'Qty', 'Unit', 'Rate', 'Amount', 'Payment', 'Note'],
      ...selectedDateExpenses.map((expense) => [
        expense.date,
        expense.category,
        expense.item,
        expense.qty || '',
        expense.unit || '',
        expense.rate || '',
        expense.amount,
        expense.payment || '',
        expense.note || '',
      ]),
    ]
  }, [selectedDateExpenses])

  const itemWiseExpenseRows = useMemo(() => {
    return [
      ['Category', 'Item', 'Unit', 'Total Qty', 'Average Rate', 'Total Amount', 'Records', 'Last Date', 'Payments'],
      ...itemWiseExpenseStats.map((itemSummary) => [
        itemSummary.category,
        itemSummary.item,
        itemSummary.unit,
        itemSummary.totalQty,
        itemSummary.averageRate.toFixed(2),
        itemSummary.totalAmount,
        itemSummary.recordsCount,
        itemSummary.lastDate,
        itemSummary.paymentModes,
      ]),
    ]
  }, [itemWiseExpenseStats])

  const selectedExpenseDayShareText = useMemo(() => {
    if (!selectedDateExpenses.length) return ''

    return [
      `${companyName}`,
      'DAY-WISE EXPENSE REPORT',
      '----------------------------------------',
      `Date          : ${formatDateLabel(selectedExpenseDate)}`,
      `Total Amount  : ${formatCurrency(selectedExpenseDayTotal)}`,
      '----------------------------------------',
      'ITEM DETAILS',
      '----------------------------------------',
      ...selectedDateExpenses.map(
        (expense, index) =>
          [
            `${index + 1}. ${expense.item}`,
            `   Qty      : ${expense.qty || '-'} ${expense.unit || ''}`.trimEnd(),
            `   Amount   : ${formatCurrency(expense.amount)}`,
            `   Payment  : ${expense.payment || 'N/A'}`,
            '----------------------------------------',
          ].join('\n'),
      ),
      `Grand Total: ${formatCurrency(selectedExpenseDayTotal)}`,
    ].join('\n')
  }, [companyName, selectedDateExpenses, selectedExpenseDate, selectedExpenseDayTotal])

  const payslipText = useMemo(() => {
    if (!selectedPerson) return ''

    return [
      companyName,
      'PAY SLIP',
      `Period: ${monthFormatter.format(new Date())}`,
      `Employee: ${selectedPerson.name}`,
      `Role: ${selectedPerson.role || 'Employee'}`,
      `Monthly Salary: ${formatCurrency(selectedPerson.monthlySalary)}`,
      `Salary Paid: ${formatCurrency(personStats.salary)}`,
      `Advance Salary: ${formatCurrency(personStats.advance)}`,
      `Balance Amount: ${formatCurrency(balanceAmount)}`,
    ].join('\n')
  }, [balanceAmount, companyName, personStats.advance, personStats.salary, selectedPerson])

  const payslipRows = useMemo(() => {
    if (!selectedPerson) return []

    return [
      ['Company', companyName],
      ['Period', monthFormatter.format(new Date())],
      ['Employee', selectedPerson.name],
      ['Role', selectedPerson.role || 'Employee'],
      ['Monthly Salary', formatCurrency(selectedPerson.monthlySalary)],
      ['Salary Paid', formatCurrency(personStats.salary)],
      ['Advance Salary', formatCurrency(personStats.advance)],
      ['Balance Amount', formatCurrency(balanceAmount)],
    ]
  }, [balanceAmount, companyName, personStats.advance, personStats.salary, selectedPerson])

  const selectedPersonOverviewRows = useMemo(() => {
    if (!selectedPerson) return []

    return [
      ['Period', 'Salary', 'Advance', 'Total Paid', 'Balance'],
      ...overviewBreakdown.map((period) => [
        period.label,
        period.salary,
        period.advance,
        period.total,
        period.balance,
      ]),
    ]
  }, [overviewBreakdown, selectedPerson])

  const adminMonthlyOverviewRows = useMemo(() => {
    return [
      ['Month', 'Salary', 'Advance', 'Total Outgoing', 'Remaining'],
      ...adminMonthlyOverview.map((month) => [
        month.label,
        month.salary,
        month.advance,
        month.total,
        month.remaining,
      ]),
    ]
  }, [adminMonthlyOverview])

  const adminPersonOverviewRows = useMemo(() => {
    return [
      ['Person', 'Role', 'Monthly Salary', 'Salary', 'Advance', 'Balance', 'Records'],
      ...allPeopleStats.map((person) => [
        person.name,
        person.role || 'Employee',
        person.monthlySalary,
        person.salary,
        person.advance,
        person.balance,
        person.recordsCount,
      ]),
    ]
  }, [allPeopleStats])

  const incomeSourceRows = useMemo(() => {
    return [
      ['Source', 'Total Income', 'Entries', 'Last Entry'],
      ...incomeSourceStats.map((source) => [
        source.source,
        source.totalAmount,
        source.recordsCount,
        source.lastDate,
      ]),
    ]
  }, [incomeSourceStats])

  const selectedMonthIncomeSourceRows = useMemo(() => {
    return [
      ['Source', 'Total for Month', 'Entries', 'Last Entry'],
      ...selectedMonthIncomeSourceStats.map((source) => [
        source.source,
        source.totalAmount,
        source.recordsCount,
        source.lastDate,
      ]),
    ]
  }, [selectedMonthIncomeSourceStats])

  const selectedDayIncomeRows = useMemo(() => {
    return [
      ['Source', 'Amount', 'Date', 'Note'],
      ...selectedDateIncomes.map((income) => [
        income.source,
        income.amount,
        income.date,
        income.note || '',
      ]),
    ]
  }, [selectedDateIncomes])

  const dailyIncomeExpenseTableRows = useMemo(() => {
    const dateMap = new Map()

    function getDateSummary(date) {
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          upiIncome: 0,
          cashIncome: 0,
          swiggyIncome: 0,
          zomatoIncome: 0,
          cashExpenses: 0,
          upiExpenses: 0,
        })
      }

      return dateMap.get(date)
    }

    incomeEntries.forEach((income) => {
      const summary = getDateSummary(income.date)
      const amount = Number(income.amount) || 0
      const source = String(income.source || '').toLowerCase()

      if (source === 'upi') summary.upiIncome += amount
      if (source === 'cash') summary.cashIncome += amount
      if (source === 'swiggy') summary.swiggyIncome += amount
      if (source === 'zomato') summary.zomatoIncome += amount
    })

    expenseEntries.forEach((expense) => {
      const summary = getDateSummary(expense.date)
      const amount = Number(expense.amount) || 0
      const payment = String(expense.payment || '').toLowerCase()

      if (payment === 'cash') summary.cashExpenses += amount
      if (payment === 'upi') summary.upiExpenses += amount
    })

    return [...dateMap.values()].sort((left, right) => new Date(right.date) - new Date(left.date))
  }, [expenseEntries, incomeEntries])

  const adminDateTableMonthLabel = useMemo(() => {
    const monthDate = new Date(`${adminDateTableMonth}-01`)
    return Number.isNaN(monthDate.getTime()) ? adminDateTableMonth : monthFormatter.format(monthDate)
  }, [adminDateTableMonth])

  const filteredDailyIncomeExpenseTableRows = useMemo(() => {
    return dailyIncomeExpenseTableRows.filter((row) => getMonthValue(row.date) === adminDateTableMonth)
  }, [adminDateTableMonth, dailyIncomeExpenseTableRows])

  const adminDateWiseIncomeExpenseRows = useMemo(() => {
    return [
      ['Date', 'UPI Income', 'Cash Income', 'Swiggy Income', 'Zomato Income', 'Cash Expenses', 'UPI Expenses'],
      ...filteredDailyIncomeExpenseTableRows.map((row) => [
        row.date,
        row.upiIncome,
        row.cashIncome,
        row.swiggyIncome,
        row.zomatoIncome,
        row.cashExpenses,
        row.upiExpenses,
      ]),
    ]
  }, [filteredDailyIncomeExpenseTableRows])

  function handleAddPerson(event) {
    event.preventDefault()

    if (!requireAdminAccess()) return

    if (!personForm.name.trim() || !personForm.monthlySalary) {
      return
    }

    const newPerson = {
      id: crypto.randomUUID(),
      name: personForm.name.trim(),
      role: personForm.role.trim(),
      monthlySalary: Number(personForm.monthlySalary),
      createdAt: new Date().toISOString(),
    }

    setPersons((current) => [newPerson, ...current])
    setSelectedPersonId(newPerson.id)
    setEntryForm(createTransactionForm(newPerson.id))
    setPersonForm(emptyPersonForm)
    setShareStatus('')
  }

  function requireAdminAccess() {
    if (!isAdminRoute) return false
    if (adminUnlocked) return true
    window.alert('Admin mode is locked. Open /admin and unlock with PIN 1234.')
    return false
  }

  function handleAdminUnlock(event) {
    event.preventDefault()

    if (adminPin === ADMIN_PIN) {
      setAdminUnlocked(true)
      setAdminPin('')
      return
    }

    window.alert('Invalid admin PIN')
  }

  function handleDeletePerson(personId) {
    if (!requireAdminAccess()) return

    const person = persons.find((item) => item.id === personId)
    if (!person) return

    const confirmed = window.confirm(`Delete ${person.name} and all salary records?`)
    if (!confirmed) return

    setPersons((current) => current.filter((item) => item.id !== personId))
    setEntries((current) => current.filter((entry) => entry.personId !== personId))
    setShareStatus('')
  }

  function handleAddEntry(event) {
    event.preventDefault()

    if (!normalizedSelectedPersonId || !entryForm.amount || !entryForm.date) {
      return
    }

    const newEntry = {
      id: crypto.randomUUID(),
      personId: normalizedSelectedPersonId,
      type: entryForm.type,
      amount: Number(entryForm.amount),
      date: entryForm.date,
      note: entryForm.note.trim(),
      createdAt: new Date().toISOString(),
    }

    setEntries((current) => pruneData({ companyName, persons, entries: [newEntry, ...current] }).entries)
    setEntryForm((current) => ({
      ...current,
      personId: normalizedSelectedPersonId,
      amount: '',
      note: '',
      date: today(),
    }))
    setSelectedPersonId(normalizedSelectedPersonId)
    setShareStatus('')
  }

  function handleDeleteEntry(entryId) {
    if (!requireAdminAccess()) return
    setEntries((current) => current.filter((entry) => entry.id !== entryId))
    setShareStatus('')
  }

  function handleExpenseItemChange(itemName) {
    const expenseOption = EXPENSE_ITEMS.find((option) => option.item === itemName)

    setExpenseForm((current) => ({
      ...current,
      item: itemName,
      category: expenseOption?.category ?? '',
      unit: expenseOption?.defaultUnit ?? current.unit,
    }))
  }

  function updateExpenseAmounts(field, value) {
    setExpenseForm((current) => {
      const nextForm = { ...current, [field]: value }
      const quantity = Number(nextForm.qty)
      const rate = Number(nextForm.rate)
      const amount = Number(nextForm.amount)

      if (field === 'amount') {
        if (nextForm.amount === '') {
          nextForm.rate = ''
        } else if (nextForm.qty !== '' && Number.isFinite(quantity) && quantity > 0 && Number.isFinite(amount)) {
          nextForm.rate = String(amount / quantity)
        }

        return nextForm
      }

      if (Number.isFinite(quantity) && Number.isFinite(rate) && nextForm.qty !== '' && nextForm.rate !== '') {
        nextForm.amount = String(quantity * rate)
      } else if (field === 'qty' && nextForm.amount !== '' && Number.isFinite(quantity) && quantity > 0 && Number.isFinite(amount)) {
        nextForm.rate = String(amount / quantity)
      } else if (field === 'qty' || field === 'rate') {
        nextForm.amount = ''
      }

      return nextForm
    })
  }

  function handleAddExpense(event) {
    event.preventDefault()

    if (!expenseForm.item || !expenseForm.date) {
      return
    }

    const quantity = expenseForm.qty === '' ? '' : Number(expenseForm.qty)
    const rate = expenseForm.rate === '' ? '' : Number(expenseForm.rate)
    const computedAmount = expenseForm.amount !== ''
      ? Number(expenseForm.amount)
      : (Number(quantity) || 0) * (Number(rate) || 0)

    if (!computedAmount) {
      return
    }

    const expenseOption = EXPENSE_ITEMS.find((option) => option.item === expenseForm.item)

    const newExpense = {
      id: crypto.randomUUID(),
      category: expenseForm.category || expenseOption?.category || 'Other',
      item: expenseForm.item,
      unit: expenseForm.unit || expenseOption?.defaultUnit || 'kg',
      qty: quantity,
      rate,
      amount: computedAmount,
      payment: expenseForm.payment.trim(),
      note: expenseForm.note.trim(),
      date: expenseForm.date,
      createdAt: new Date().toISOString(),
    }

    setExpenses((current) => pruneData({
      companyName,
      persons,
      entries,
      expenses: [newExpense, ...current],
    }).expenses)
    setExpenseForm(createExpenseForm())
    setSelectedExpenseDate(newExpense.date)
    setShareStatus('')
  }

  function handleDeleteExpense(expenseId) {
    if (!requireAdminAccess()) return
    setExpenses((current) => current.filter((expense) => expense.id !== expenseId))
    setShareStatus('')
  }

  function handleAddIncome(event) {
    event.preventDefault()

    if (!incomeForm.amount || !incomeForm.date) {
      return
    }

    const newIncome = {
      id: crypto.randomUUID(),
      source: incomeForm.source,
      amount: Number(incomeForm.amount),
      date: incomeForm.date,
      note: incomeForm.note.trim(),
      createdAt: new Date().toISOString(),
    }

    setIncomes((current) => pruneData({
      companyName,
      persons,
      entries,
      expenses,
      incomes: [newIncome, ...current],
    }).incomes)
    setIncomeForm(createIncomeForm())
    setSelectedIncomeDate(newIncome.date)
    setShareStatus('')
  }

  function handleDeleteIncome(incomeId) {
    if (!requireAdminAccess()) return
    setIncomes((current) => current.filter((income) => income.id !== incomeId))
    setShareStatus('')
  }

  function handleDownloadPayslip() {
    if (!payslipText || !selectedPerson) return

    try {
      const pdfFile = createPayslipPdfBlob(
        `${selectedPerson.name.replace(/\s+/g, '-').toLowerCase()}-payslip`,
        companyName,
        payslipRows,
      )

      const fileUrl = URL.createObjectURL(pdfFile)
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = pdfFile.name
      link.click()
      URL.revokeObjectURL(fileUrl)

      setShareStatus('Payslip PDF downloaded successfully.')
    } catch {
      setShareStatus('Unable to download the payslip PDF right now.')
    }
  }

  function handleDownloadSelectedPersonYearOverview() {
    if (!selectedPerson || selectedPersonOverviewRows.length <= 1) {
      setShareStatus('No year overview data available to download.')
      return
    }

    downloadExcelFile(
      `${selectedPerson.name.replace(/\s+/g, '-').toLowerCase()}-${overviewFilterMode}-overview-${overviewFilterMode === 'month' ? overviewMonth : overviewYear}`,
      selectedPersonOverviewRows,
    )
    setShareStatus('Year overview Excel file downloaded successfully.')
  }

  function handleDownloadAdminMonthlyOverview() {
    if (adminMonthlyOverviewRows.length <= 1) {
      setShareStatus('No monthly admin tracking data available to download.')
      return
    }

    downloadExcelFile('admin-monthly-payroll-overview', adminMonthlyOverviewRows)
    setShareStatus('Monthly admin tracking Excel file downloaded successfully.')
  }

  function handleDownloadAdminPersonOverview() {
    if (adminPersonOverviewRows.length <= 1) {
      setShareStatus('No person-wise admin tracking data available to download.')
      return
    }

    downloadExcelFile('admin-person-wise-salary-advance-balance', adminPersonOverviewRows)
    setShareStatus('Person-wise admin tracking Excel file downloaded successfully.')
  }

  function handleDownloadExpenseDayReport() {
    if (selectedExpenseDayRows.length <= 1) {
      setShareStatus('No expense data available for the selected day.')
      return
    }

    downloadExcelFile(`expense-day-report-${selectedExpenseDate}`, selectedExpenseDayRows)
    setShareStatus('Day-wise expense Excel file downloaded successfully.')
  }

  function handleDownloadItemWiseExpenseReport() {
    if (itemWiseExpenseRows.length <= 1) {
      setShareStatus(`No item-wise expense data available for ${itemWiseSummaryRangeLabel}.`)
      return
    }

    const suffix = itemSummaryFilter === 'day'
      ? itemSummaryDate
      : itemSummaryFilter === 'month'
        ? itemSummaryMonth
        : 'last-1-year'

    downloadExcelFile(`item-wise-expense-tracking-${suffix}`, itemWiseExpenseRows)
    setShareStatus('Item-wise expense Excel file downloaded successfully.')
  }

  function handleDownloadIncomeSourceReport() {
    if (incomeSourceRows.length <= 1) {
      setShareStatus('No source-wise income data available to download.')
      return
    }

    downloadExcelFile('income-source-wise-last-1-year', incomeSourceRows)
    setShareStatus('Source-wise income Excel file downloaded successfully.')
  }

  function handleDownloadSelectedMonthIncomeSourceReport() {
    if (selectedMonthIncomeSourceRows.length <= 1) {
      setShareStatus('No month-wise source income data available to download.')
      return
    }

    downloadExcelFile(`income-sources-${selectedIncomeMonth}`, selectedMonthIncomeSourceRows)
    setShareStatus('Month-wise source income Excel file downloaded successfully.')
  }

  function handleDownloadSelectedDayIncomeReport() {
    if (selectedDayIncomeRows.length <= 1) {
      setShareStatus('No day-wise income data available to download.')
      return
    }

    downloadExcelFile(`income-day-records-${selectedIncomeDate}`, selectedDayIncomeRows)
    setShareStatus('Day-wise income Excel file downloaded successfully.')
  }

  function handleDownloadAdminAnalyticsReport() {
    if (adminAnalyticsRows.length <= 1) {
      setShareStatus('No analytics data available to download.')
      return
    }

    downloadExcelFile(
      `admin-analytics-${analyticsRange}-${analyticsPeriodLabel.replaceAll(' ', '-')}`,
      adminAnalyticsRows,
    )
    setShareStatus('Admin analytics Excel file downloaded successfully.')
  }

  function handleDownloadAdminDateWiseIncomeExpenseReport() {
    if (adminDateWiseIncomeExpenseRows.length <= 1) {
      setShareStatus(`No date-wise income and expense data available for ${adminDateTableMonthLabel}.`)
      return
    }

    downloadExcelFile(`admin-date-wise-income-expense-${adminDateTableMonth}`, adminDateWiseIncomeExpenseRows)
    setShareStatus('Date-wise income and expense Excel file downloaded successfully.')
  }

  async function handleCopyExpenseDayReport() {
    if (!selectedExpenseDayShareText) {
      setShareStatus('No expense share data available for the selected day.')
      return
    }

    try {
      await navigator.clipboard.writeText(selectedExpenseDayShareText)
      setShareStatus('Day-wise expense share text copied successfully.')
    } catch {
      setShareStatus('Unable to copy the day-wise expense share text right now.')
    }
  }

  const canManagePeople = isAdminRoute && adminUnlocked
  const canAddSalaryRecords = persons.length > 0
  const showAdminTrackingTab = isAdminRoute
  const showAdminExpensesTab = isAdminRoute
  const showAdminAnalyticsTab = isAdminRoute

  function renderExpenseShareTable(emptyMessage) {
    if (!selectedDateExpenses.length) {
      return (
        <div className='empty-state compact-empty'>
          <h3>No expense data for this day</h3>
          <p>{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className='expense-share-layout'>
        <div className='expense-share-meta'>
          <div>
            <small>Report date</small>
            <strong>{formatDateLabel(selectedExpenseDate)}</strong>
          </div>
          <div>
            <small>Total entries</small>
            <strong>{selectedDateExpenses.length}</strong>
          </div>
          <div>
            <small>Total amount</small>
            <strong>{formatCurrency(selectedExpenseDayTotal)}</strong>
          </div>
        </div>

        <div className='expense-table-wrap'>
          <table className='expense-share-table'>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {selectedDateExpenses.map((expense, index) => (
                <tr key={expense.id}>
                  <td>{index + 1}</td>
                  <td>{expense.item}</td>
                  <td>{expense.category}</td>
                  <td>
                    {expense.qty || '-'} {expense.unit || ''}
                  </td>
                  <td>{formatCurrency(expense.rate)}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{expense.payment || 'N/A'}</td>
                  <td>{expense.note || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan='5'>Total</td>
                <td>{formatCurrency(selectedExpenseDayTotal)}</td>
                <td colSpan='2'>
                  {new Set(selectedDateExpenses.map((expense) => expense.category)).size} categories
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  function renderItemWiseSummaryTable() {
    if (!itemWiseExpenseStats.length) {
      return (
        <div className='empty-state compact-empty'>
          <h3>No item-wise expense tracking yet</h3>
          <p>Adjust the day/month filter or add expense entries to see item-wise totals here.</p>
        </div>
      )
    }

    return (
      <div className='expense-share-layout'>
        <div className='expense-share-meta'>
          <div>
            <small>Filter range</small>
            <strong>{itemWiseSummaryRangeLabel}</strong>
          </div>
          <div>
            <small>Tracked items</small>
            <strong>{itemWiseExpenseStats.length}</strong>
          </div>
          <div>
            <small>Total records</small>
            <strong>{filteredItemSummaryExpenses.length}</strong>
          </div>
          <div>
            <small>Total expense</small>
            <strong>{formatCurrency(filteredItemSummaryTotals.total)}</strong>
          </div>
        </div>

        <div className='expense-table-wrap'>
          <table className='expense-share-table'>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Total Qty</th>
                <th>Avg Rate</th>
                <th>Total Amount</th>
                <th>Records</th>
                <th>Last Date</th>
                <th>Payments</th>
              </tr>
            </thead>
            <tbody>
              {itemWiseExpenseStats.map((itemSummary, index) => (
                <tr key={`${itemSummary.category}-${itemSummary.item}-${itemSummary.unit}`}>
                  <td>{index + 1}</td>
                  <td>{itemSummary.item}</td>
                  <td>{itemSummary.category}</td>
                  <td>{itemSummary.unit || '-'}</td>
                  <td>{itemSummary.totalQty || '-'}</td>
                  <td>{formatCurrency(itemSummary.averageRate)}</td>
                  <td>{formatCurrency(itemSummary.totalAmount)}</td>
                  <td>{itemSummary.recordsCount}</td>
                  <td>{formatDateLabel(itemSummary.lastDate)}</td>
                  <td>{itemSummary.paymentModes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan='5'>Overall item-wise total</td>
                <td>-</td>
                <td>{formatCurrency(filteredItemSummaryTotals.total)}</td>
                <td>{filteredItemSummaryExpenses.length}</td>
                <td>-</td>
                <td>{filteredItemSummaryTotals.items.size} unique items</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className='app-shell'>
      <header className='hero-card'>
        <div>
          <p className='eyebrow'>Income & Expense Tracker</p>
          <h1>Track salary, advance salary, income, and expenses in one place.</h1>
          <p className='hero-copy'>
            Store all records in this React app for 365 days, manage people person wise, and review
            salary, income, expense, and admin analytics from one dashboard.
          </p>
        </div>

        <div className='hero-stats'>
          <div>
            <span>{persons.length}</span>
            <small>People</small>
          </div>
          <div>
            <span>{incomeEntries.length + expenseEntries.length}</span>
            <small>Income & expenses tracker</small>
          </div>
          <div>
            <span>365 days</span>
            <small>Next data expiry</small>
          </div>
        </div>
      </header>

      <div className='page-tabs'>
        <button
          className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          type='button'
          onClick={() => setActiveTab('manage')}
        >
          {isAdminRoute ? 'Person management' : 'Salary entry'}
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses-entry' ? 'active' : ''}`}
          type='button'
          onClick={() => setActiveTab('expenses-entry')}
        >
          Expense entry
        </button>
          <button
          className={`tab-button ${activeTab === 'income-entry' ? 'active' : ''}`}
          type='button'
          onClick={() => setActiveTab('income-entry')}
        >
          Income entry
        </button>
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          type='button'
          onClick={() => setActiveTab('overview')}
        >
          Salary overview
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses-overview' ? 'active' : ''}`}
          type='button'
          onClick={() => setActiveTab('expenses-overview')}
        >
          Expenses overview
        </button>
        <button
          className={`tab-button ${activeTab === 'income-overview' ? 'active' : ''}`}
          type='button'
          onClick={() => setActiveTab('income-overview')}
        >
          Income overview
        </button>
        {showAdminTrackingTab ? (
          <button
            className={`tab-button ${activeTab === 'admin-tracking' ? 'active' : ''}`}
            type='button'
            onClick={() => setActiveTab('admin-tracking')}
          >
            Admin salary tracking
          </button>
        ) : null}
        {showAdminExpensesTab ? (
          <button
            className={`tab-button ${activeTab === 'admin-expenses' ? 'active' : ''}`}
            type='button'
            onClick={() => setActiveTab('admin-expenses')}
          >
            Admin expenses tracker
          </button>
        ) : null}
        {showAdminAnalyticsTab ? (
          <button
            className={`tab-button ${activeTab === 'admin-analytics' ? 'active' : ''}`}
            type='button'
            onClick={() => setActiveTab('admin-analytics')}
          >
            Admin analytics
          </button>
        ) : null}
      </div>

      {activeTab === 'manage' ? (
        <main className='view-grid'>
          {isAdminRoute ? (
            <section className='panel stack-gap'>
              <div className='section-heading'>
                <div>
                  <p className='section-kicker'>Person management</p>
                  <h2>{canManagePeople ? 'Add a person' : 'Person management is admin only'}</h2>
                </div>
              </div>

              {canManagePeople ? (
                <form className='form-grid' onSubmit={handleAddPerson}>
                  <label>
                    Person name
                    <input
                      type='text'
                      placeholder='Enter full name'
                      value={personForm.name}
                      onChange={(event) =>
                        setPersonForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Role / department
                    <input
                      type='text'
                      placeholder='Optional'
                      value={personForm.role}
                      onChange={(event) =>
                        setPersonForm((current) => ({ ...current, role: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Monthly salary
                    <input
                      type='number'
                      min='0'
                      placeholder='25000'
                      value={personForm.monthlySalary}
                      onChange={(event) =>
                        setPersonForm((current) => ({ ...current, monthlySalary: event.target.value }))
                      }
                      required
                    />
                  </label>

                  <button className='primary-button' type='submit'>
                    Add person
                  </button>
                </form>
              ) : (
                <div className='empty-state compact-empty admin-lock-note'>
                  <h3>Unlock admin to add people</h3>
                  <p>Enter the admin PIN to enable person creation and salary management.</p>
                </div>
              )}

              <section className='admin-card'>
                <div className='section-heading compact'>
                  <div>
                    <p className='section-kicker'>Admin control</p>
                    <h2>Admin only settings</h2>
                  </div>
                  <span className={`pill ${adminUnlocked ? 'pill-success' : ''}`}>
                    {adminUnlocked ? 'Admin unlocked' : 'Locked'}
                  </span>
                </div>

                {adminUnlocked ? (
                  <>
                    <label>
                      Company name
                      <input
                        type='text'
                        value={companyName}
                        onChange={(event) => {
                          setCompanyName(event.target.value)
                          setShareStatus('')
                        }}
                        placeholder='Enter company name'
                      />
                    </label>
                    <button
                      className='secondary-button'
                      type='button'
                      onClick={() => setAdminUnlocked(false)}
                    >
                      Lock admin mode
                    </button>
                  </>
                ) : (
                  <form className='admin-form' onSubmit={handleAdminUnlock}>
                    <input
                      type='password'
                      placeholder='Enter admin PIN'
                      value={adminPin}
                      onChange={(event) => setAdminPin(event.target.value)}
                    />
                    <button className='primary-button' type='submit'>
                      Unlock
                    </button>
                  </form>
                )}

                <small>Admin tools are shown only on /admin. Default PIN: 1234</small>
              </section>
            </section>
          ) : null}

          <section className='panel stack-gap'>
            <div className='section-heading'>
              <div>
                <p className='section-kicker'>Salary records</p>
                <h2>{selectedPerson ? `Add record for ${selectedPerson.name}` : 'Add salary or advance'}</h2>
              </div>
            </div>

            {canAddSalaryRecords ? (
              <form className='form-grid transaction-form' onSubmit={handleAddEntry}>
                <label>
                  Person
                  <select
                    value={normalizedSelectedPersonId}
                    onChange={(event) => {
                      const nextPersonId = event.target.value
                      setSelectedPersonId(nextPersonId)
                      setShareStatus('')
                    }}
                    disabled={!persons.length}
                  >
                    <option value=''>Select person</option>
                    {persons.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Entry type
                  <select
                    value={entryForm.type}
                    onChange={(event) =>
                      setEntryForm((current) => ({ ...current, type: event.target.value }))
                    }
                  >
                    <option value='salary'>Salary</option>
                    <option value='advance'>Advance</option>
                  </select>
                </label>

                <label>
                  Amount
                  <input
                    type='number'
                    min='0'
                    placeholder='5000'
                    value={entryForm.amount}
                    onChange={(event) =>
                      setEntryForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    required
                  />
                </label>

                <label>
                  Date
                  <input
                    type='date'
                    value={entryForm.date}
                    onChange={(event) =>
                      setEntryForm((current) => ({ ...current, date: event.target.value }))
                    }
                    required
                  />
                </label>

                <label className='full-width'>
                  Note
                  <input
                    type='text'
                    placeholder='Optional note'
                    value={entryForm.note}
                    onChange={(event) =>
                      setEntryForm((current) => ({ ...current, note: event.target.value }))
                    }
                  />
                </label>

                <button className='primary-button' type='submit' disabled={!persons.length}>
                  Add record
                </button>
              </form>
            ) : (
              <div className='empty-state compact-empty admin-lock-note'>
                <h3>No people available for salary entry</h3>
                <p>
                  Admin can add people from the <strong>/admin</strong> page first. After that, salary or
                  advance records can be added for those people from this page too.
                </p>
              </div>
            )}

            {selectedPerson ? (
              <div className='summary-grid summary-grid-manage'>
                <article className='summary-card accent-card'>
                  <small>Monthly salary</small>
                  <strong>{formatCurrency(selectedPerson.monthlySalary)}</strong>
                </article>
                <article className='summary-card'>
                  <small>Salary paid</small>
                  <strong>{formatCurrency(personStats.salary)}</strong>
                </article>
                <article className='summary-card'>
                  <small>Advance paid</small>
                  <strong>{formatCurrency(personStats.advance)}</strong>
                </article>
                <article className='summary-card'>
                  <small>Balance amount</small>
                  <strong>{formatCurrency(balanceAmount)}</strong>
                </article>
              </div>
            ) : (
              <div className='empty-state compact-empty'>
                <h3>No person selected</h3>
                <p>Add a person first, then record salary and advance entries.</p>
              </div>
            )}
          </section>
        </main>
      ) : activeTab === 'overview' ? (
        <main className='panel stack-gap single-overview-panel'>
          <section className='single-overview-section stack-gap'>
              <div className='section-heading'>
              <div>
                <p className='section-kicker'>Salary overview</p>
                <h2>All salary details in one card</h2>
                <p className='simple-helper-text'>Use the month/year filter and select a row to view salary details, reports, and history in this single section.</p>
              </div>
              <div className='section-actions'>
                <div className='filter-toggle' role='group' aria-label='Overview filter mode'>
                  <button
                    className={`filter-toggle-button ${overviewFilterMode === 'month' ? 'active' : ''}`}
                    type='button'
                    onClick={() => {
                      setOverviewFilterMode('month')
                      setShareStatus('')
                    }}
                  >
                    Month
                  </button>
                  <button
                    className={`filter-toggle-button ${overviewFilterMode === 'year' ? 'active' : ''}`}
                    type='button'
                    onClick={() => {
                      setOverviewFilterMode('year')
                      setShareStatus('')
                    }}
                  >
                    Year
                  </button>
                </div>

                {overviewFilterMode === 'month' ? (
                  <label className='inline-field'>
                    Month
                    <input
                      type='month'
                      value={overviewMonth}
                      onChange={(event) => {
                        setOverviewMonth(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                ) : (
                  <label className='inline-field'>
                    Year
                    <input
                      type='number'
                      min='2000'
                      max='2100'
                      step='1'
                      value={overviewYear}
                      onChange={(event) => {
                        setOverviewYear(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className='overview-filter-note'>Showing records for {overviewPeriodLabel}</div>

            <div className='expense-table-wrap people-table-wrap'>
              {overviewPeopleStats.length ? (
                <table className='expense-share-table people-overview-table'>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Person</th>
                      <th>Role</th>
                      <th>Monthly Salary</th>
                      <th>Salary</th>
                      <th>Advance</th>
                      <th>Balance</th>
                      <th>Records</th>
                      {isAdminRoute ? <th>Action</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {overviewPeopleStats.map((person, index) => (
                      <tr
                        className={person.id === selectedPersonId ? 'table-row-active' : ''}
                        key={person.id}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <button
                            className='table-select-button'
                            type='button'
                            onClick={() => {
                              setSelectedPersonId(person.id)
                              setShareStatus('')
                            }}
                          >
                            {person.name}
                          </button>
                        </td>
                        <td>{person.role || 'No role added'}</td>
                        <td>{formatCurrency(person.monthlySalary)}</td>
                        <td>{formatCurrency(person.salary)}</td>
                        <td>{formatCurrency(person.advance)}</td>
                        <td>{formatCurrency(person.balance)}</td>
                        <td>{person.recordsCount}</td>
                        {isAdminRoute ? (
                          <td>
                            <button
                              className='danger-button table-action-button'
                              type='button'
                              onClick={() => handleDeletePerson(person.id)}
                              disabled={!adminUnlocked}
                            >
                              Delete
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className='empty-state compact-empty'>
                  <h3>No people found for this filter</h3>
                  <p>Try another month/year or add salary records to see people here.</p>
                </div>
              )}
            </div>
          </section>

          <section className='single-overview-section stack-gap'>
            <div className='section-heading'>
              <div>
                <p className='section-kicker'>Selected person</p>
                <h2>{selectedPerson ? selectedPerson.name : 'Choose a person'}</h2>
              </div>
              {selectedPerson ? <span className='pill'>{selectedPerson.role || 'Employee'}</span> : null}
            </div>

            {selectedPerson ? (
              <div className='single-overview-content stack-gap'>
                <div className='summary-grid summary-grid-wide'>
                  <article className='summary-card accent-card'>
                    <small>Monthly salary</small>
                    <strong>{formatCurrency(selectedPerson.monthlySalary)}</strong>
                  </article>
                  <article className='summary-card'>
                    <small>{overviewFilterMode === 'month' ? 'Month salary paid' : 'Year salary paid'}</small>
                    <strong>{formatCurrency(overviewPersonStats.salary)}</strong>
                  </article>
                  <article className='summary-card'>
                    <small>{overviewFilterMode === 'month' ? 'Month advance paid' : 'Year advance paid'}</small>
                    <strong>{formatCurrency(overviewPersonStats.advance)}</strong>
                  </article>
                  <article className='summary-card'>
                    <small>{overviewFilterMode === 'month' ? 'Month balance' : 'Year balance'}</small>
                    <strong>{formatCurrency(overviewBalanceAmount)}</strong>
                  </article>
                  <article className='summary-card'>
                    <small>Remaining days</small>
                    <strong>{overviewNextExpiryEntry ? `${getRemainingDays(overviewNextExpiryEntry.date)} days` : '365 days'}</strong>
                  </article>
                </div>

                <div className='single-overview-block'>
                  <div className='section-heading compact'>
                    <div>
                      <p className='section-kicker'>{overviewFilterMode === 'month' ? 'Month overview' : 'Year overview'}</p>
                      <h3>{overviewFilterMode === 'month' ? overviewPeriodLabel : `${overviewYear} monthly breakdown`}</h3>
                    </div>
                    <div className='section-actions'>
                      {overviewNextExpiryEntry ? (
                        <small className='inline-note'>Next record expires on {getExpiryDate(overviewNextExpiryEntry.date)}</small>
                      ) : null}
                      <button
                        className='secondary-button'
                        type='button'
                        onClick={handleDownloadSelectedPersonYearOverview}
                      >
                        Download Excel
                      </button>
                    </div>
                  </div>

                  <div className='expense-table-wrap'>
                    <table className='expense-share-table'>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{overviewFilterMode === 'month' ? 'Period' : 'Month'}</th>
                          <th>Salary</th>
                          <th>Advance</th>
                          <th>Total Paid</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewBreakdown.map((period, index) => (
                          <tr key={period.key}>
                            <td>{index + 1}</td>
                            <td>{period.label}</td>
                            <td>{formatCurrency(period.salary)}</td>
                            <td>{formatCurrency(period.advance)}</td>
                            <td>{formatCurrency(period.total)}</td>
                            <td>{formatCurrency(period.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan='2'>Total</td>
                          <td>{formatCurrency(overviewPersonStats.salary)}</td>
                          <td>{formatCurrency(overviewPersonStats.advance)}</td>
                          <td>{formatCurrency(overviewPersonStats.total)}</td>
                          <td>{formatCurrency(overviewBalanceAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className='single-overview-divider' />

                <div className='single-overview-block'>
                  <div className='section-heading compact'>
                    <div>
                      <p className='section-kicker'>Employee share format</p>
                      <h3>Payslip with company name</h3>
                    </div>
                    <button className='secondary-button' type='button' onClick={handleDownloadPayslip}>
                      Download PDF
                    </button>
                  </div>

                  <div className='payslip-table-wrap'>
                    <table className='payslip-table'>
                      <thead>
                        <tr>
                          <th colSpan='2'>{companyName}</th>
                        </tr>
                        <tr>
                          <th colSpan='2'>PAY SLIP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payslipRows.map(([label, value]) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {shareStatus ? <p className='status-text'>{shareStatus}</p> : null}
                </div>

                <div className='single-overview-divider' />

                <div className='single-overview-block'>
                  <div className='section-heading compact'>
                    <div>
                      <p className='section-kicker'>Transaction history</p>
                      <h3>Person-wise records</h3>
                    </div>
                  </div>

                  {overviewPersonEntries.length ? (
                    <div className='expense-table-wrap'>
                      <table className='expense-share-table'>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Note</th>
                            <th>Remaining Days</th>
                            <th>Expiry Date</th>
                            {isAdminRoute ? <th>Action</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {overviewPersonEntries.map((entry, index) => (
                            <tr key={entry.id}>
                              <td>{index + 1}</td>
                              <td>{formatDateLabel(entry.date)}</td>
                              <td>
                                <span className={`tag ${entry.type}`}>{entry.type}</span>
                              </td>
                              <td>{formatCurrency(entry.amount)}</td>
                              <td>{entry.note || '-'}</td>
                              <td>{getRemainingDays(entry.date)} days</td>
                              <td>{getExpiryDate(entry.date)}</td>
                              {isAdminRoute ? (
                                <td>
                                  <button
                                    type='button'
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    disabled={!adminUnlocked}
                                  >
                                    Remove
                                  </button>
                                </td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className='empty-state compact-empty'>
                      <h3>No records for this filter</h3>
                      <p>Try another month/year or add a salary or advance transaction from the Person management tab.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='empty-state large-empty'>
                <h3>Create or select a person</h3>
                <p>
                  Use the first tab to add people and salary records, then come back here for the
                  people list, year overview, and payslip view.
                </p>
              </div>
            )}
          </section>
        </main>
      ) : activeTab === 'expenses-entry' || activeTab === 'expenses-overview' ? (
        <main className='view-grid'>
          {activeTab === 'expenses-entry' ? (
          <section className='panel stack-gap'>
            <div className='section-heading'>
              <div>
                <p className='section-kicker'>Expense entry</p>
                <h2>Add day-wise expense data</h2>
                <p className='simple-helper-text'>Track category, item, quantity, rate, amount, and payment.</p>
              </div>
            </div>

            <form className='form-grid transaction-form' onSubmit={handleAddExpense}>
              <label>
                Item
                <select
                  value={expenseForm.item}
                  onChange={(event) => handleExpenseItemChange(event.target.value)}
                  required
                >
                  <option value=''>Select item</option>
                  {Object.entries(EXPENSE_ITEM_GROUPS).map(([category, options]) => (
                    <optgroup key={category} label={category}>
                      {options.map((option) => (
                        <option key={option.item} value={option.item}>
                          {option.item}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label>
                Category
                <input type='text' value={expenseForm.category} placeholder='Auto selected' readOnly />
              </label>

              <label>
                Qty
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='1'
                  value={expenseForm.qty}
                  onChange={(event) => updateExpenseAmounts('qty', event.target.value)}
                />
              </label>

              <label>
                Unit
                <select
                  value={expenseForm.unit}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, unit: event.target.value }))
                  }
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Rate
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='1200'
                  value={expenseForm.rate}
                  onChange={(event) => updateExpenseAmounts('rate', event.target.value)}
                />
              </label>

              <label>
                Amount
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='Auto from qty × rate'
                  value={expenseForm.amount}
                  onChange={(event) => updateExpenseAmounts('amount', event.target.value)}
                />
              </label>

              <label>
                Date
                <input
                  type='date'
                  value={expenseForm.date}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, date: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Payment
                <select
                  value={expenseForm.payment}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, payment: event.target.value }))
                  }
                >
                  <option value=''>Select payment</option>
                  {PAYMENT_OPTIONS.map((payment) => (
                    <option key={payment} value={payment}>
                      {payment}
                    </option>
                  ))}
                </select>
              </label>

              <label className='full-width'>
                Note
                <input
                  type='text'
                  placeholder='Optional note'
                  value={expenseForm.note}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, note: event.target.value }))
                  }
                />
              </label>

              <button className='primary-button' type='submit'>
                Add expense
              </button>
            </form>

            <div className='summary-grid summary-grid-manage'>
              <article className='summary-card accent-card'>
                <small>Selected day total</small>
                <strong>{formatCurrency(selectedExpenseDayTotal)}</strong>
              </article>
              <article className='summary-card'>
                <small>Today expense</small>
                <strong>{formatCurrency(expenseTotals.today)}</strong>
              </article>
              <article className='summary-card'>
                <small>Current month expense</small>
                <strong>{formatCurrency(expenseTotals.currentMonth)}</strong>
              </article>
              <article className='summary-card'>
                <small>One year expense</small>
                <strong>{formatCurrency(expenseTotals.total)}</strong>
              </article>
            </div>
          </section>
          ) : null}

          {activeTab === 'expenses-overview' ? (
          <section className='panel detail-panel stack-gap'>
            <div className='section-heading'>
              <div>
                <p className='section-kicker'>Expenses overview</p>
                <h2>Share and review daily expenses</h2>
              </div>
              <label className='inline-field'>
                Select date
                <input
                  type='date'
                  value={selectedExpenseDate}
                  onChange={(event) => {
                    setSelectedExpenseDate(event.target.value)
                    setShareStatus('')
                  }}
                />
              </label>
            </div>

            <div className='summary-grid summary-grid-manage'>
              <article className='summary-card accent-card'>
                <small>Day total</small>
                <strong>{formatCurrency(selectedExpenseDayTotal)}</strong>
              </article>
              <article className='summary-card'>
                <small>Items added</small>
                <strong>{selectedDateExpenses.length}</strong>
              </article>
              <article className='summary-card'>
                <small>Categories used</small>
                <strong>{new Set(selectedDateExpenses.map((expense) => expense.category)).size}</strong>
              </article>
              <article className='summary-card'>
                <small>Payment types</small>
                <strong>{new Set(selectedDateExpenses.map((expense) => expense.payment).filter(Boolean)).size}</strong>
              </article>
            </div>

            <section className='overview-card'>
              <div className='section-heading compact'>
                <div>
                  <p className='section-kicker'>Share day-wise data</p>
                  <h3>{formatDateLabel(selectedExpenseDate)}</h3>
                </div>
                <div className='section-actions'>
                  <button className='secondary-button' type='button' onClick={handleCopyExpenseDayReport}>
                    Copy share text
                  </button>
                  <button className='secondary-button' type='button' onClick={handleDownloadExpenseDayReport}>
                    Download Excel
                  </button>
                </div>
              </div>

              {renderExpenseShareTable('Select another date or add expense entries to see the report here.')}

              {shareStatus ? <p className='status-text'>{shareStatus}</p> : null}
            </section>

            <section className='overview-card'>
              <div className='section-heading compact'>
                <div>
                  <p className='section-kicker'>Day records</p>
                  <h3>Item-wise day entries</h3>
                </div>
              </div>

              {selectedDateExpenses.length ? (
                <div className='expense-table-wrap'>
                  <table className='expense-share-table'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Note</th>
                        <th>Date</th>
                        {isAdminRoute ? <th>Action</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDateExpenses.map((expense, index) => (
                        <tr key={expense.id}>
                          <td>{index + 1}</td>
                          <td>{expense.item}</td>
                          <td>{expense.category}</td>
                          <td>
                            {expense.qty || '-'} {expense.unit || ''}
                          </td>
                          <td>{formatCurrency(expense.rate)}</td>
                          <td>{formatCurrency(expense.amount)}</td>
                          <td>{expense.payment || 'N/A'}</td>
                          <td>{expense.note || '-'}</td>
                          <td>{formatDateLabel(expense.date)}</td>
                          {isAdminRoute ? (
                            <td>
                              <button
                                type='button'
                                onClick={() => handleDeleteExpense(expense.id)}
                                disabled={!adminUnlocked}
                              >
                                Remove
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan='5'>Grand Total</td>
                        <td>{formatCurrency(selectedExpenseDayTotal)}</td>
                        <td>{selectedDateExpenses.length} items</td>
                        <td colSpan={isAdminRoute ? 3 : 2}>Selected day entries</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className='empty-state compact-empty'>
                  <h3>No expense data for this day</h3>
                  <p>Select another date or add a new expense entry.</p>
                </div>
              )}
            </section>
          </section>
          ) : null}
        </main>
      ) : activeTab === 'income-entry' || activeTab === 'income-overview' ? (
        <main className='view-grid'>
          {activeTab === 'income-entry' ? (
          <section className='panel stack-gap'>
            <div className='section-heading'>
              <div>
                <p className='section-kicker'>Income entry</p>
                <h2>Add income from cash, UPI, Swiggy, and Zomato</h2>
                <p className='simple-helper-text'>Track income source, amount, date, and note for one year.</p>
              </div>
            </div>

            <form className='form-grid transaction-form' onSubmit={handleAddIncome}>
              <label>
                Income source
                <select
                  value={incomeForm.source}
                  onChange={(event) =>
                    setIncomeForm((current) => ({ ...current, source: event.target.value }))
                  }
                >
                  {INCOME_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input
                  type='number'
                  min='0'
                  placeholder='2500'
                  value={incomeForm.amount}
                  onChange={(event) =>
                    setIncomeForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Date
                <input
                  type='date'
                  value={incomeForm.date}
                  onChange={(event) =>
                    setIncomeForm((current) => ({ ...current, date: event.target.value }))
                  }
                  required
                />
              </label>

              <label className='full-width'>
                Note
                <input
                  type='text'
                  placeholder='Optional note'
                  value={incomeForm.note}
                  onChange={(event) =>
                    setIncomeForm((current) => ({ ...current, note: event.target.value }))
                  }
                />
              </label>

              <button className='primary-button' type='submit'>
                Add income
              </button>
            </form>

            <div className='summary-grid summary-grid-manage'>
              <article className='summary-card accent-card'>
                <small>Selected day income</small>
                <strong>{formatCurrency(selectedIncomeDayTotal)}</strong>
              </article>
              <article className='summary-card'>
                <small>Selected month income</small>
                <strong>{formatCurrency(selectedIncomeMonthTotal)}</strong>
              </article>
              <article className='summary-card'>
                <small>Today income</small>
                <strong>{formatCurrency(incomeTotals.today)}</strong>
              </article>
              <article className='summary-card'>
                <small>Current month income</small>
                <strong>{formatCurrency(incomeTotals.currentMonth)}</strong>
              </article>
              <article className='summary-card'>
                <small>One year income</small>
                <strong>{formatCurrency(incomeTotals.total)}</strong>
              </article>
            </div>
          </section>
          ) : null}

          {activeTab === 'income-overview' ? (
          <section className='panel detail-panel stack-gap'>
            <div className='section-heading'>
              <div>
                <p className='section-kicker'>Income overview</p>
                <h2>Source-wise and day-wise income records</h2>
              </div>
              <label className='inline-field'>
                Select date
                <input
                  type='date'
                  value={selectedIncomeDate}
                  onChange={(event) => {
                    setSelectedIncomeDate(event.target.value)
                    setShareStatus('')
                  }}
                />
              </label>
              <label className='inline-field'>
                Select month
                <input
                  type='month'
                  value={selectedIncomeMonth}
                  onChange={(event) => {
                    setSelectedIncomeMonth(event.target.value)
                    setShareStatus('')
                  }}
                />
              </label>
            </div>

            <div className='summary-grid summary-grid-manage'>
              <article className='summary-card accent-card'>
                <small>Day total</small>
                <strong>{formatCurrency(selectedIncomeDayTotal)}</strong>
              </article>
              <article className='summary-card'>
                <small>Month total</small>
                <strong>{formatCurrency(selectedIncomeMonthTotal)}</strong>
              </article>
              <article className='summary-card'>
                <small>Day records</small>
                <strong>{selectedDateIncomes.length}</strong>
              </article>
              <article className='summary-card'>
                <small>Month records</small>
                <strong>{selectedMonthIncomes.length}</strong>
              </article>
              <article className='summary-card'>
                <small>Income sources used</small>
                <strong>{incomeTotals.sources.size}</strong>
              </article>
              <article className='summary-card'>
                <small>Top sources tracked</small>
                <strong>{incomeSourceStats.length}</strong>
              </article>
            </div>

            <section className='overview-card'>
              <div className='section-heading compact'>
                <div>
                  <p className='section-kicker'>Source-wise income totals</p>
                  <h3>Last 1 year income breakdown</h3>
                </div>
                <button className='secondary-button' type='button' onClick={handleDownloadIncomeSourceReport}>
                  Download Excel
                </button>
              </div>

              {incomeSourceStats.length ? (
                <div className='expense-table-wrap'>
                  <table className='expense-share-table'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Source</th>
                        <th>Total Income</th>
                        <th>Entries</th>
                        <th>Last Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeSourceStats.map((source, index) => (
                        <tr key={source.source}>
                          <td>{index + 1}</td>
                          <td>{source.source}</td>
                          <td>{formatCurrency(source.totalAmount)}</td>
                          <td>{source.recordsCount}</td>
                          <td>{formatDateLabel(source.lastDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan='2'>Total</td>
                        <td>{formatCurrency(incomeTotals.total)}</td>
                        <td>{incomeEntries.length}</td>
                        <td>{incomeSourceStats.length} sources</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className='empty-state compact-empty'>
                  <h3>No income data added yet</h3>
                  <p>Add cash, UPI, Swiggy, or Zomato income to view source-wise totals.</p>
                </div>
              )}
            </section>

            <section className='overview-card'>
              <div className='section-heading compact'>
                <div>
                  <p className='section-kicker'>Month-wise source records</p>
                  <h3>Income sources for {selectedIncomeMonth}</h3>
                </div>
                <button className='secondary-button' type='button' onClick={handleDownloadSelectedMonthIncomeSourceReport}>
                  Download Excel
                </button>
              </div>

              {selectedMonthIncomeSourceStats.length ? (
                <div className='expense-table-wrap'>
                  <table className='expense-share-table'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Source</th>
                        <th>Total for Month</th>
                        <th>Entries</th>
                        <th>Last Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMonthIncomeSourceStats.map((source, index) => (
                        <tr key={`${selectedIncomeMonth}-${source.source}`}>
                          <td>{index + 1}</td>
                          <td>{source.source}</td>
                          <td>{formatCurrency(source.totalAmount)}</td>
                          <td>{source.recordsCount}</td>
                          <td>{formatDateLabel(source.lastDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan='2'>Total</td>
                        <td>{formatCurrency(selectedIncomeMonthTotal)}</td>
                        <td>{selectedMonthIncomes.length}</td>
                        <td>{selectedMonthIncomeSourceStats.length} sources</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className='empty-state compact-empty'>
                  <h3>No income data for this month</h3>
                  <p>Select another month or add income entries to view month-wise source records.</p>
                </div>
              )}
            </section>

            <section className='overview-card'>
              <div className='section-heading compact'>
                <div>
                  <p className='section-kicker'>Day records</p>
                  <h3>Income entries for {formatDateLabel(selectedIncomeDate)}</h3>
                </div>
                <button className='secondary-button' type='button' onClick={handleDownloadSelectedDayIncomeReport}>
                  Download Excel
                </button>
              </div>

              {selectedDateIncomes.length ? (
                <div className='expense-table-wrap'>
                  <table className='expense-share-table'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Source</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Note</th>
                        {isAdminRoute ? <th>Action</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDateIncomes.map((income, index) => (
                        <tr key={income.id}>
                          <td>{index + 1}</td>
                          <td>{income.source}</td>
                          <td>{formatCurrency(income.amount)}</td>
                          <td>{formatDateLabel(income.date)}</td>
                          <td>{income.note || '-'}</td>
                          {isAdminRoute ? (
                            <td>
                              <button
                                type='button'
                                onClick={() => handleDeleteIncome(income.id)}
                                disabled={!adminUnlocked}
                              >
                                Remove
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan='2'>Total</td>
                        <td>{formatCurrency(selectedIncomeDayTotal)}</td>
                        <td>{formatDateLabel(selectedIncomeDate)}</td>
                        <td>{selectedDateIncomes.length} entries</td>
                        {isAdminRoute ? <td>-</td> : null}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className='empty-state compact-empty'>
                  <h3>No income data for this day</h3>
                  <p>Select another date or add a new income entry.</p>
                </div>
              )}
            </section>
          </section>
          ) : null}
        </main>
      ) : activeTab === 'admin-tracking' ? (
        <main className='panel stack-gap'>
          <div className='section-heading'>
            <div>
              <p className='section-kicker'>Admin salary tracking</p>
              <h2>How much is going for salary</h2>
            </div>
            <span className={`pill ${adminUnlocked ? 'pill-success' : ''}`}>
              {adminUnlocked ? 'Admin unlocked' : 'Locked'}
            </span>
          </div>

          <p className='admin-summary-copy'>
            Monitor salary payout, advances, and total outgoing in one place. This tab is visible
            only on the admin page.
          </p>

          <div className='summary-grid admin-grid'>
            <article className='summary-card admin-stat-card admin-stat-highlight'>
              <small>Monthly payroll commitment</small>
              <strong>{formatCurrency(monthlyPayrollCommitment)}</strong>
              <span>Expected total monthly salary for all people</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Total salary outgoing</small>
              <strong>{formatCurrency(adminTotals.salaryOutgoing)}</strong>
              <span>All salary payments stored in the last 1 year</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Total advance outgoing</small>
              <strong>{formatCurrency(adminTotals.advanceOutgoing)}</strong>
              <span>Advance salary amount paid to employees</span>
            </article>
            <article className='summary-card admin-stat-card accent-card'>
              <small>Total outgoing</small>
              <strong>{formatCurrency(adminTotals.totalOutgoing)}</strong>
              <span>Salary and advance combined</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Current month outgoing</small>
              <strong>{formatCurrency(adminTotals.currentMonthOutgoing)}</strong>
              <span>Amount recorded in the current month</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Current month remaining</small>
              <strong>{formatCurrency(currentMonthRemaining)}</strong>
              <span>Monthly payroll commitment minus current month outgoing</span>
            </article>
          </div>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Monthly admin tracking</p>
                <h3>Last 12 months payroll overview</h3>
              </div>
              <button className='secondary-button' type='button' onClick={handleDownloadAdminMonthlyOverview}>
                Download Excel
              </button>
            </div>

            <div className='month-grid'>
              {adminMonthlyOverview.map((month) => (
                <div className='month-card' key={month.key}>
                  <h4>{month.label}</h4>
                  <p>Salary: {formatCurrency(month.salary)}</p>
                  <p>Advance: {formatCurrency(month.advance)}</p>
                  <p>Total outgoing: {formatCurrency(month.total)}</p>
                  <p>Remaining: {formatCurrency(month.remaining)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Admin person overview</p>
                <h3>Person-wise salary, advance, and balance</h3>
              </div>
              <button className='secondary-button' type='button' onClick={handleDownloadAdminPersonOverview}>
                Download Excel
              </button>
            </div>

            <div className='records-list'>
              {allPeopleStats.length ? (
                allPeopleStats.map((person) => (
                  <article className='record-row' key={person.id}>
                    <div>
                      <div className='record-title-row'>
                        <strong>{person.name}</strong>
                        <span className='tag salary'>{person.role || 'Employee'}</span>
                      </div>
                      <p>
                        Monthly Salary: {formatCurrency(person.monthlySalary)} | Salary:{' '}
                        {formatCurrency(person.salary)} | Advance: {formatCurrency(person.advance)}
                      </p>
                      <small className='record-subtext'>
                        Records: {person.recordsCount} | Balance: {formatCurrency(person.balance)}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <div className='empty-state compact-empty'>
                  <h3>No people added yet</h3>
                  <p>Add people from the admin panel to view person-wise balances here.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      ) : activeTab === 'admin-analytics' ? (
        <main className='panel stack-gap'>
          <div className='section-heading'>
            <div>
              <p className='section-kicker'>Admin analytics</p>
              <h2>Salary, expenses, and income analytics</h2>
            </div>
            <span className={`pill ${adminUnlocked ? 'pill-success' : ''}`}>
              {adminUnlocked ? 'Admin unlocked' : 'Locked'}
            </span>
          </div>

          <p className='admin-summary-copy'>
            Review day-wise, month-wise, and year-wise analytics for salary payout, expenses, income,
            and overall net balance.
          </p>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Analytics filter</p>
                <h3>{analyticsPeriodLabel}</h3>
              </div>
              <div className='section-actions'>
                <label className='inline-field'>
                  Range
                  <select
                    value={analyticsRange}
                    onChange={(event) => {
                      setAnalyticsRange(event.target.value)
                      setShareStatus('')
                    }}
                  >
                    <option value='day'>Day</option>
                    <option value='month'>Month</option>
                    <option value='year'>Year</option>
                  </select>
                </label>

                {analyticsRange === 'day' ? (
                  <label className='inline-field'>
                    Day
                    <input
                      type='date'
                      value={analyticsDay}
                      onChange={(event) => {
                        setAnalyticsDay(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                ) : null}

                {analyticsRange === 'month' ? (
                  <label className='inline-field'>
                    Month
                    <input
                      type='month'
                      value={analyticsMonth}
                      onChange={(event) => {
                        setAnalyticsMonth(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                ) : null}

                {analyticsRange === 'year' ? (
                  <label className='inline-field'>
                    Year
                    <input
                      type='number'
                      min='2000'
                      max='2100'
                      step='1'
                      value={analyticsYear}
                      onChange={(event) => {
                        setAnalyticsYear(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                ) : null}

                <button className='secondary-button' type='button' onClick={handleDownloadAdminAnalyticsReport}>
                  Download Excel
                </button>
              </div>
            </div>
          </section>

          <div className='summary-grid admin-grid'>
            <article className='summary-card admin-stat-card admin-stat-highlight'>
              <small>Income total</small>
              <strong>{formatCurrency(analyticsIncomeSummary.total)}</strong>
              <span>{analyticsIncomeSummary.records} income records</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Salary paid</small>
              <strong>{formatCurrency(analyticsSalarySummary.salary)}</strong>
              <span>Salary records for selected {analyticsRange}</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Advance paid</small>
              <strong>{formatCurrency(analyticsSalarySummary.advance)}</strong>
              <span>Advance entries in selected {analyticsRange}</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Total expense</small>
              <strong>{formatCurrency(analyticsExpenseSummary.total)}</strong>
              <span>{analyticsExpenseSummary.records} expense records</span>
            </article>
            <article className='summary-card admin-stat-card accent-card'>
              <small>Net balance</small>
              <strong>{formatCurrency(analyticsNetBalance)}</strong>
              <span>Income minus salary/advance and expenses</span>
            </article>
          </div>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Date-wise income and expense table</p>
                <h3>{adminDateTableMonthLabel}</h3>
              </div>
              <div className='section-actions'>
                <label className='inline-field'>
                  Month
                  <input
                    type='month'
                    value={adminDateTableMonth}
                    onChange={(event) => {
                      setAdminDateTableMonth(event.target.value)
                      setShareStatus('')
                    }}
                  />
                </label>
                <button
                  className='secondary-button'
                  type='button'
                  onClick={handleDownloadAdminDateWiseIncomeExpenseReport}
                >
                  Download Excel
                </button>
              </div>
            </div>

            {filteredDailyIncomeExpenseTableRows.length ? (
              <div className='expense-table-wrap'>
                <table className='expense-share-table'>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>UPI Income</th>
                      <th>Cash Income</th>
                      <th>Swiggy Income</th>
                      <th>Zomato Income</th>
                      <th>Cash Expenses</th>
                      <th>UPI Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDailyIncomeExpenseTableRows.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDateLabel(row.date)}</td>
                        <td>{formatCurrency(row.upiIncome)}</td>
                        <td>{formatCurrency(row.cashIncome)}</td>
                        <td>{formatCurrency(row.swiggyIncome)}</td>
                        <td>{formatCurrency(row.zomatoIncome)}</td>
                        <td>{formatCurrency(row.cashExpenses)}</td>
                        <td>{formatCurrency(row.upiExpenses)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='empty-state compact-empty'>
                <h3>No combined records for this month</h3>
                <p>Select another month or add income and expense entries to see the date-wise admin summary table.</p>
              </div>
            )}

            {shareStatus ? <p className='status-text'>{shareStatus}</p> : null}
          </section>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Period summary</p>
                <h3>{analyticsPeriodLabel}</h3>
              </div>
            </div>

            <div className='expense-table-wrap'>
              <table className='expense-share-table'>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Income total</td>
                    <td>{formatCurrency(analyticsIncomeSummary.total)}</td>
                    <td>{analyticsIncomeSummary.sources.size} sources used</td>
                  </tr>
                  <tr>
                    <td>Salary total</td>
                    <td>{formatCurrency(analyticsSalarySummary.salary)}</td>
                    <td>{analyticsSalarySummary.records} salary/advance records</td>
                  </tr>
                  <tr>
                    <td>Advance total</td>
                    <td>{formatCurrency(analyticsSalarySummary.advance)}</td>
                    <td>Advance payments only</td>
                  </tr>
                  <tr>
                    <td>Expense total</td>
                    <td>{formatCurrency(analyticsExpenseSummary.total)}</td>
                    <td>{analyticsExpenseSummary.categories.size} categories used</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td>Net balance</td>
                    <td>{formatCurrency(analyticsNetBalance)}</td>
                    <td>Income - salary - advance - expenses</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Salary analytics</p>
                <h3>Person-wise payout summary</h3>
              </div>
            </div>

            {analyticsPersonSalaryStats.length ? (
              <div className='expense-table-wrap'>
                <table className='expense-share-table'>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Person</th>
                      <th>Role</th>
                      <th>Salary</th>
                      <th>Advance</th>
                      <th>Total</th>
                      <th>Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsPersonSalaryStats.map((person, index) => (
                      <tr key={`${person.personId}-${analyticsPeriodLabel}`}>
                        <td>{index + 1}</td>
                        <td>{person.name}</td>
                        <td>{person.role}</td>
                        <td>{formatCurrency(person.salary)}</td>
                        <td>{formatCurrency(person.advance)}</td>
                        <td>{formatCurrency(person.total)}</td>
                        <td>{person.records}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='empty-state compact-empty'>
                <h3>No salary analytics for this {analyticsRange}</h3>
                <p>Select another period or add salary records.</p>
              </div>
            )}
          </section>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Expense analytics</p>
                <h3>Category-wise expense summary</h3>
              </div>
            </div>

            {analyticsExpenseCategoryStats.length ? (
              <div className='expense-table-wrap'>
                <table className='expense-share-table'>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Category</th>
                      <th>Total Amount</th>
                      <th>Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsExpenseCategoryStats.map((category, index) => (
                      <tr key={`${category.category}-${analyticsPeriodLabel}`}>
                        <td>{index + 1}</td>
                        <td>{category.category}</td>
                        <td>{formatCurrency(category.total)}</td>
                        <td>{category.records}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='empty-state compact-empty'>
                <h3>No expense analytics for this {analyticsRange}</h3>
                <p>Select another period or add expense records.</p>
              </div>
            )}
          </section>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Income analytics</p>
                <h3>Source-wise income summary</h3>
              </div>
            </div>

            {analyticsIncomeSourceStats.length ? (
              <div className='expense-table-wrap'>
                <table className='expense-share-table'>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Source</th>
                      <th>Total Amount</th>
                      <th>Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsIncomeSourceStats.map((source, index) => (
                      <tr key={`${source.source}-${analyticsPeriodLabel}`}>
                        <td>{index + 1}</td>
                        <td>{source.source}</td>
                        <td>{formatCurrency(source.total)}</td>
                        <td>{source.records}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='empty-state compact-empty'>
                <h3>No income analytics for this {analyticsRange}</h3>
                <p>Select another period or add income records.</p>
              </div>
            )}

          </section>
        </main>
      ) : (
        <main className='panel stack-gap'>
          <div className='section-heading'>
            <div>
              <p className='section-kicker'>Admin expenses tracker</p>
              <h2>Item-wise expenses</h2>
            </div>
            <span className={`pill ${adminUnlocked ? 'pill-success' : ''}`}>
              {adminUnlocked ? 'Admin unlocked' : 'Locked'}
            </span>
          </div>

          <p className='admin-summary-copy'>
            Monitor expense records for one year and track item-wise totals from the admin expenses tracker.
          </p>

          <div className='summary-grid admin-grid'>
            <article className='summary-card admin-stat-card admin-stat-highlight'>
              <small>Total expense amount</small>
              <strong>{formatCurrency(expenseTotals.total)}</strong>
              <span>All stored expenses for the last 1 year</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Today expense</small>
              <strong>{formatCurrency(expenseTotals.today)}</strong>
              <span>Total expense recorded today</span>
            </article>
            <article className='summary-card admin-stat-card'>
              <small>Current month expense</small>
              <strong>{formatCurrency(expenseTotals.currentMonth)}</strong>
              <span>Total expense recorded this month</span>
            </article>
          </div>

          <section className='overview-card'>
            <div className='section-heading compact'>
              <div>
                <p className='section-kicker'>Item-wise tracking</p>
                <h3>Overall item-wise expense summary</h3>
              </div>
              <div className='section-actions'>
                <label className='inline-field'>
                  Filter
                  <select
                    value={itemSummaryFilter}
                    onChange={(event) => {
                      setItemSummaryFilter(event.target.value)
                      setShareStatus('')
                    }}
                  >
                    <option value='all'>Overall</option>
                    <option value='day'>Day wise</option>
                    <option value='month'>Month wise</option>
                  </select>
                </label>

                {itemSummaryFilter === 'day' ? (
                  <label className='inline-field'>
                    Day
                    <input
                      type='date'
                      value={itemSummaryDate}
                      onChange={(event) => {
                        setItemSummaryDate(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                ) : null}

                {itemSummaryFilter === 'month' ? (
                  <label className='inline-field'>
                    Month
                    <input
                      type='month'
                      value={itemSummaryMonth}
                      onChange={(event) => {
                        setItemSummaryMonth(event.target.value)
                        setShareStatus('')
                      }}
                    />
                  </label>
                ) : null}

                <button className='secondary-button' type='button' onClick={handleDownloadItemWiseExpenseReport}>
                  Download Excel
                </button>
              </div>
            </div>

            {renderItemWiseSummaryTable()}

            {shareStatus ? <p className='status-text'>{shareStatus}</p> : null}
          </section>
        </main>
      )}
    </div>
  )
}

export default App
