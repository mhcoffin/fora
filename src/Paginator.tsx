import React, { useReducer } from 'react'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import {
  Card,
  CardContent,
  Grid,
  IconButton,
  Typography
} from '@material-ui/core'
import FirstPageIcon from '@material-ui/icons/FirstPage'
import ChevronLeft from '@material-ui/icons/ChevronLeft'
import ChevronRight from '@material-ui/icons/ChevronRight'
import LastPageIcon from '@material-ui/icons/LastPage'
import 'firebase/app'
import 'firebase/firestore'
import type { Post } from './Forum'

type DocumentReference = firebase.firestore.DocumentReference
type Snapshot = firebase.firestore.DocumentSnapshot

type PaginatorProps = {
  label: string
  pageSize: number
  sizeQuery: firebase.firestore.DocumentReference
  forwardQuery: (index: number) => firebase.firestore.Query
  backwardQuery: (index: number) => firebase.firestore.Query
  countFunction: (doc: Snapshot) => number
}

type State = {
  index: number
  count: number
  direction: 'forward' | 'backward'
  query: firebase.firestore.Query
}

const Paginator = ({
  label,
  pageSize,
  sizeQuery,
  forwardQuery,
  backwardQuery,
  countFunction
}: PaginatorProps) => {
  const [doc, loading, error] = useDocument(sizeQuery)

  if (error) {
    throw new Error()
  } else if (loading) {
    return <div>Loading...</div>
  } else if (doc == null) {
    throw new Error()
  } else {
    return (
      <Paginate
        label={label}
        initialState={{
          index: 0,
          count: countFunction(doc),
          direction: 'forward',
          query: forwardQuery(0)
        }}
        pageSize={pageSize}
        forwardQuery={forwardQuery}
        backwardQuery={backwardQuery}
      />
    )
  }
}

type PaginateProps = {
  label: string
  initialState: State
  pageSize: number
  forwardQuery: (index: number) => firebase.firestore.Query
  backwardQuery: (index: number) => firebase.firestore.Query
}

const Paginate = ({
  label,
  initialState,
  pageSize,
  forwardQuery,
  backwardQuery
}: PaginateProps) => {
  const reducer = (state: State, action: any): State => {
    switch (action.type) {
      case 'top':
        return {
          ...state,
          index: 0,
          direction: 'forward',
          query: forwardQuery(state.index)
        }
      case 'bottom':
        return {
          ...state,
          index: state.count - (state.count % pageSize),
          direction: 'backward',
          query: backwardQuery(state.count - (state.count % pageSize))
        }
      case 'forward':
        return {
          ...state,
          index: state.index + pageSize,
          query: forwardQuery(state.index + pageSize)
        }
      case 'back':
        return {
          ...state,
          index: state.index - pageSize,
          direction: 'backward',
          query: backwardQuery(state.index - pageSize)
        }
    }
    return state
  }
  const [state, dispatch] = useReducer(reducer, initialState)
  const [response, loading, error] = useCollection(state.query)

  if (error) {
    throw new Error()
  } else if (loading) {
    return <div>Loading</div>
  } else if (!response) {
    throw new Error()
  } else {
    const docs =
      state.direction === 'forward'
        ? response.docs
        : [...response.docs].reverse()
    return (
      <React.Fragment>
        <PaginationHeader
          label={label}
          index={state.index}
          pageSize={pageSize}
          dispatch={dispatch}
        />
        <PaginationBody docs={docs} />
      </React.Fragment>
    )
  }
}

const PaginationHeader = ({ label, index, size, dispatch, pageSize }: any) => {
  const page = Math.floor(index / size)
  const totalPages = Math.floor(size / pageSize) + 1
  return (
    <Card style={{ backgroundColor: 'lightgray', margin: 10 }}>
      <CardContent>
        <Grid container justify='space-between'>
          <Grid item xs={8}>
            <Typography variant='h6'>{label}</Typography>
            Displaying page {page + 1} of {totalPages}
          </Grid>
          <Grid item xs={1}>
            <IconButton
              onClick={() => dispatch({ type: 'top' })}
              disabled={page === 0}
            >
              <FirstPageIcon />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              onClick={() => dispatch({ type: 'back' })}
              disabled={page === 0}
            >
              <ChevronLeft />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              onClick={() => dispatch({ type: 'forward' })}
              disabled={page === totalPages - 1}
            >
              <ChevronRight />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              onClick={() => dispatch({ type: 'bottom' })}
              disabled={page === totalPages - 1}
            >
              <LastPageIcon />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const PaginationBody = ({
  docs
}: {
  docs: firebase.firestore.DocumentSnapshot[]
}) => {
  return (
    <React.Fragment>
      {docs.map((doc) => {
        const post = doc.data()
        if (post === undefined) {
          return null
        } else {
          return (post as Post).Body
        }
      })}
    </React.Fragment>
  )
}
