import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Download, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction, UserSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';
import * as XLSX from 'xlsx';

interface TransactionHistoryProps {
  transactions: Transaction[];
  settings: UserSettings;
}

type Filter = {
  startDate: string;
  endDate: string;
  type: 'all' | 'expense' | 'earning';
  category: string;
  search: string;
};

// Helper function to get date string in YYYY-MM-DD format
const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get default dates (last 7 days)
const getDefaultDates = () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    startDate: getDateString(sevenDaysAgo),
    endDate: getDateString(today),
  };
};

export function TransactionHistory({ transactions, settings }: TransactionHistoryProps) {
  const defaultDates = getDefaultDates();
  const [filter, setFilter] = useState<Filter>({
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    type: 'all',
    category: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Quick filter functions
  const setQuickFilter = (days: number | 'all') => {
    if (days === 'all') {
      setFilter({ ...filter, startDate: '', endDate: '' });
    } else {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - days);
      setFilter({ 
        ...filter, 
        startDate: getDateString(pastDate), 
        endDate: getDateString(today) 
      });
    }
    setCurrentPage(1);
  };

  // Get unique categories from transactions
  const categories = [...new Set(transactions.map(t => t.category))];

  // Filter and paginate transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesDate = (!filter.startDate || new Date(t.date) >= new Date(filter.startDate)) &&
                         (!filter.endDate || new Date(t.date) <= new Date(filter.endDate));
      const matchesType = filter.type === 'all' || t.type === filter.type;
      const matchesCategory = filter.category === 'all' || t.category === filter.category;
      const matchesSearch = !filter.search ||
        t.comment.toLowerCase().includes(filter.search.toLowerCase()) ||
        t.category.toLowerCase().includes(filter.search.toLowerCase());

      return matchesDate && matchesType && matchesCategory && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
  }, [transactions, filter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: Partial<Filter>) => {
    setFilter({ ...filter, ...newFilter });
    setCurrentPage(1);
  };

  // Export transactions to Excel
  const exportToExcel = () => {
    const data = filteredTransactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      Category: t.category,
      Amount: formatCurrency(t.amount, settings.defaultCurrency),
      Comment: t.comment
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
  };

  // Export dashboard data to Excel (advanced)
  const exportDashboardToExcel = () => {
    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Transactions sheet
    const transactionsSheet = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      Category: t.category,
      Amount: t.amount,
      Currency: settings.defaultCurrency,
      Comment: t.comment
    })));
    XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Transactions');

    // Summary by Category sheet
    const categoryData = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(t => t.category === category);
      const totalExpense = categoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalEarning = categoryTransactions
        .filter(t => t.type === 'earning')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        Category: category,
        'Total Expense': totalExpense,
        'Total Earning': totalEarning,
        'Net': totalEarning - totalExpense
      };
    });
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Category Summary');

    // Monthly Summary sheet
    const monthlyData = Array.from(new Set(
      filteredTransactions.map(t => 
        new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' })
      )
    )).map(monthYear => {
      const monthTransactions = filteredTransactions.filter(t => 
        new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === monthYear
      );
      return {
        'Month/Year': monthYear,
        'Total Expense': monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        'Total Earning': monthTransactions
          .filter(t => t.type === 'earning')
          .reduce((sum, t) => sum + t.amount, 0),
        'Net Balance': monthTransactions.reduce((sum, t) => 
          sum + (t.type === 'earning' ? t.amount : -t.amount), 0)
      };
    });
    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Summary');

    // Save the workbook
    XLSX.writeFile(wb, 'expense-manager-report.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-strong p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] backdrop-blur-xl space-y-4">
        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground mr-2">Quick Filter:</span>
          <Button
            size="sm"
            variant={filter.startDate === getDefaultDates().startDate && filter.endDate === getDefaultDates().endDate ? 'default' : 'outline'}
            onClick={() => setQuickFilter(7)}
            className={filter.startDate === getDefaultDates().startDate && filter.endDate === getDefaultDates().endDate ? 'bg-[#00FFFF] text-[#0B0C10]' : 'glass border-[rgba(255,255,255,0.2)]'}
          >
            Last 7 Days
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuickFilter(30)}
            className="glass border-[rgba(255,255,255,0.2)]"
          >
            Last 30 Days
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuickFilter(90)}
            className="glass border-[rgba(255,255,255,0.2)]"
          >
            Last 90 Days
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuickFilter('all')}
            className="glass border-[rgba(255,255,255,0.2)]"
          >
            All Time
          </Button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-40">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="date"
              placeholder="Start Date"
              value={filter.startDate}
              onChange={e => handleFilterChange({ startDate: e.target.value })}
              className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 pl-10 bg-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <div className="relative w-40">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="date"
              placeholder="End Date"
              value={filter.endDate}
              onChange={e => handleFilterChange({ endDate: e.target.value })}
              className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 pl-10 bg-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <Select
            value={filter.type}
            onValueChange={value => handleFilterChange({ type: value as Filter['type'] })}
          >
            <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 w-[180px] bg-transparent">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="earning">Earnings</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.category}
            onValueChange={value => handleFilterChange({ category: value })}
          >
            <SelectTrigger className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 w-[200px] bg-transparent">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-xl backdrop-blur-2xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={filter.search}
              onChange={e => handleFilterChange({ search: e.target.value })}
              className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 pl-10 bg-transparent"
            />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="glass border-[rgba(255,255,255,0.2)] hover:border-primary hover:text-primary hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-xl h-11"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Transactions
            </Button>
            <Button
              variant="outline"
              onClick={exportDashboardToExcel}
              className="glass border-[rgba(255,255,255,0.2)] hover:border-primary hover:text-primary hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-xl h-11"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Full Report
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 border border-[rgba(255,255,255,0.05)] backdrop-blur-xl text-center">
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Add some transactions or adjust your filters</p>
          </div>
        ) : (
          paginatedTransactions.map((transaction, index) => (
            <div
              key={index}
              className={`glass-strong p-5 rounded-2xl flex items-center justify-between border border-[rgba(255,255,255,0.05)] hover:border-${
                transaction.type === 'expense' ? '[#FF6B9D]' : '[#00FFFF]'
              } hover:shadow-[0_0_15px_rgba(${
                transaction.type === 'expense' ? '255,107,157' : '0,255,255'
              },0.15)] transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  transaction.type === 'expense' 
                    ? 'bg-[#FF6B9D] shadow-[0_0_10px_rgba(255,107,157,0.5)]' 
                    : 'bg-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.5)]'
                }`} />
                <div>
                  <p className="text-foreground font-medium">{transaction.category}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(transaction.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className={`text-lg font-medium ${
                    transaction.type === 'expense' 
                      ? 'text-[#FF6B9D]' 
                      : 'text-[#00FFFF]'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount, settings.defaultCurrency)}
                  </p>
                  {transaction.originalCurrency && transaction.originalCurrency !== settings.defaultCurrency && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Originally: {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.originalAmount!, transaction.originalCurrency)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-0.5">{transaction.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-strong p-4 rounded-2xl border border-[rgba(255,255,255,0.05)] backdrop-blur-xl flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="glass border-[rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? 'bg-[#00FFFF] text-[#0B0C10] w-9' : 'glass border-[rgba(255,255,255,0.2)] w-9'}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="glass border-[rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}