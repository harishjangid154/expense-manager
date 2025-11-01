import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Download, Filter, Search } from 'lucide-react';
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

export function TransactionHistory({ transactions, settings }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<Filter>({
    startDate: '',
    endDate: '',
    type: 'all',
    category: 'all',
    search: '',
  });

  // Get unique categories from transactions
  const categories = [...new Set(transactions.map(t => t.category))];

  // Filter transactions based on criteria
  const filteredTransactions = transactions.filter(t => {
    const matchesDate = (!filter.startDate || new Date(t.date) >= new Date(filter.startDate)) &&
                       (!filter.endDate || new Date(t.date) <= new Date(filter.endDate));
    const matchesType = filter.type === 'all' || t.type === filter.type;
    const matchesCategory = filter.category === 'all' || t.category === filter.category;
    const matchesSearch = !filter.search ||
      t.comment.toLowerCase().includes(filter.search.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.search.toLowerCase());

    return matchesDate && matchesType && matchesCategory && matchesSearch;
  });

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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-40">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="date"
              placeholder="Start Date"
              value={filter.startDate}
              onChange={e => setFilter({ ...filter, startDate: e.target.value })}
              className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 pl-10 bg-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <div className="relative w-40">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="date"
              placeholder="End Date"
              value={filter.endDate}
              onChange={e => setFilter({ ...filter, endDate: e.target.value })}
              className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 pl-10 bg-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <Select
            value={filter.type}
            onValueChange={value => setFilter({ ...filter, type: value as Filter['type'] })}
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
            onValueChange={value => setFilter({ ...filter, category: value })}
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
              onChange={e => setFilter({ ...filter, search: e.target.value })}
              className="glass border-[rgba(255,255,255,0.15)] rounded-xl h-11 pl-10 bg-transparent"
            />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-muted-foreground">
            {filteredTransactions.length} transactions found
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
              className="glass border-[rgba(255,255,255,0.2)] hover:border-primary"
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
          filteredTransactions.map((transaction, index) => (
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
    </div>
  );
}