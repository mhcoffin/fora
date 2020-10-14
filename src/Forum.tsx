import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import firebase from 'firebase/app'
import { useCollection } from 'react-firebase-hooks/firestore'
import { Card, Divider, Grid, IconButton, Typography } from '@material-ui/core'
import CardContent from '@material-ui/core/CardContent'
import { Link, Redirect, Route, Switch, useParams } from 'react-router-dom'
import ChevronLeft from '@material-ui/icons/ChevronLeft'
import ChevronRight from '@material-ui/icons/ChevronRight'
import FirstPageIcon from '@material-ui/icons/FirstPage'
import LastPageIcon from '@material-ui/icons/LastPage'
import { encodeQueryParams, useQueryParams } from './encodeQueryParams'
import DocumentData = firebase.firestore.DocumentData

type DeleteInfo = {
  When: firebase.firestore.Timestamp
  Who: string
  Why: string
}

export type Post = {
  Path: string[]
  Index: number
  Parent: string
  Head: string
  Body: string
  Author: string
  AuthorDisplayName: string
  LastReply: {
    Subject: string
    Author: string
    AuthorDisplayName: string
    CreateTime: firebase.firestore.Timestamp
  }
  ChildCount: number
  DescendentCount: number
  ViewCount: number
  Deleted: DeleteInfo
  CreateTime: firebase.firestore.Timestamp
  BumpTime: firebase.firestore.Timestamp
  EditTime: firebase.firestore.Timestamp
}

/**
 * Forum component
 */
export const Forum = () => {
  const [user, loading, error] = useAuthState(firebase.auth())
  if (loading) {
    return <div>Signing In...</div>
  } else if (error) {
    return <div>{error.message}</div>
  } else if (user) {
    return <ForumRouter />
  } else {
    return <div>Wha??</div>
  }
}

export const ForumRouter = () => {
  return (
    <Switch>
      <Route path={`/forum/s/:id`}>
        <Section />
      </Route>
      <Route path='/forum/t/:thread'>
        <Thread />
      </Route>
      <Route path='/forum'>
        <SectionList />
      </Route>
      <Route path='/'>
        <Redirect to='/forum' />
      </Route>
    </Switch>
  )
}

/**
 * List of forum sections
 */
export const SectionList = () => {
  const sectionQuery = firebase
    .firestore()
    .collection('Posts')
    .where('Parent', '==', '')
    .orderBy('Index')
  const [sections, loading, error] = useCollection(sectionQuery, {})

  if (loading) {
    return <div>Loading...</div>
  } else if (error) {
    return <div>Error: {error.message}</div>
  } else if (sections) {
    return (
      <div>
        <SectionListHeader />
        {sections.docs.map((snapshot) => (
          <SectionListItem
            key={snapshot.ref.id}
            id={snapshot.ref.id}
            data={snapshot.data() as Post}
          />
        ))}
      </div>
    )
  }
  return <div> empty. </div>
}

// Header for the sections
const SectionListHeader = () => {
  return (
    <Card>
      <CardContent>
        <Grid container direction='row'>
          <Grid item xs={6} />
          <Grid item xs={1}>
            Topics
          </Grid>
          <Grid item xs={1}>
            Views
          </Grid>
          <Grid item xs={4}>
            Last Post
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const SectionListItem = ({ id, data }: { id: string; data: Post }) => {
  const query = encodeQueryParams({
    name: data.Head,
    time: firebase.firestore.Timestamp.now(),
    direction: 'forward',
    index: 0,
    threadCount: data.ChildCount,
    limit: pageSize
  })
  return (
    <Card>
      <CardContent>
        <Grid container direction='row' justify='space-between'>
          <Grid item xs={6}>
            <Link to={`/forum/s/${id}${query}`}>
              <Typography variant='h6'>{data.Head}</Typography>
            </Link>
          </Grid>
          <Grid item xs={1}>
            {data.ChildCount || 0}
          </Grid>
          <Grid item xs={1}>
            {data.ViewCount || 0}
          </Grid>
          <Grid item xs={4}>
            <div>{data.LastReply?.Subject || 'Last post'}</div>
            <div>by {data.LastReply?.Author || 'anonymous'}</div>
            <div>{data.LastReply?.CreateTime.toDate().toLocaleString()}</div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const useSection = (
  id: string,
  time: firebase.firestore.Timestamp,
  direction: 'forward' | 'backward',
  limit: number
): [DocumentData[] | undefined, boolean, Error | undefined] => {
  const query = firebase
    .firestore()
    .collection('Posts')
    .where('Parent', '==', id)
    .orderBy('Bump.Time', direction === 'forward' ? 'desc' : 'asc')
    .startAfter(time)
    .limit(limit)
  const [threads, loading, error] = useCollection(query)
  if (threads) {
    const docs =
      direction === 'forward' ? threads.docs : [...threads.docs].reverse()
    return [docs, loading, error]
  } else {
    return [undefined, loading, error]
  }
}

const Section = () => {
  const { id } = useParams()
  const { name, index, limit, threadCount, time, direction } = useQueryParams()
  const [docs, loading, error] = useSection(id, time, direction, limit)

  if (loading || loading) {
    return <div>Loading</div>
  } else if (error) {
    return <div>Error: {error.message}</div>
  } else if (!docs) {
    return <div>Error: no threads!?</div>
  } else {
    return (
      <React.Fragment>
        <SectionHeader
          id={id}
          name={name}
          topTime={docs[0].data().Bump.Time}
          bottomTime={docs[docs.length - 1].data().Bump.Time}
          index={index}
          limit={limit}
          threadCount={threadCount}
        />
        {docs.map((doc) => (
          <ThreadListItem key={doc.ref.id} thread={doc} />
        ))}
      </React.Fragment>
    )
  }
}

type SectionHeaderProps = {
  id: string
  name: string
  topTime: number
  bottomTime: number
  index: number
  limit: number
  threadCount: number
}

const SectionHeader = ({
  id,
  name,
  topTime,
  bottomTime,
  index,
  threadCount
}: SectionHeaderProps) => {
  const page = Math.floor(index / pageSize) + 1
  const totalPages = Math.floor(threadCount / pageSize) + 1

  const topQueryParams = encodeQueryParams({
    name: name,
    time: firebase.firestore.Timestamp.now(),
    index: 0,
    limit: pageSize,
    threadCount: threadCount,
    direction: 'forward'
  })
  const forwardQueryParams = encodeQueryParams({
    name: name,
    time: bottomTime,
    index: index + pageSize,
    limit: pageSize,
    threadCount: threadCount,
    direction: 'forward'
  })
  const backwardQueryParams = encodeQueryParams({
    name: name,
    time: topTime,
    index: index - pageSize,
    limit: pageSize,
    threadCount: threadCount,
    direction: 'backward'
  })
  const bottomQueryParams = encodeQueryParams({
    name: name,
    time: new firebase.firestore.Timestamp(0, 1),
    index: threadCount - (threadCount % pageSize),
    limit: threadCount % pageSize,
    threadCount: threadCount,
    direction: 'backward'
  })

  return (
    <Card
      style={{ margin: 10, backgroundColor: 'lightgrey' }}
      variant='outlined'
    >
      <CardContent>
        <Grid container justify='space-between'>
          <Grid item xs={8}>
            <Typography variant='h6'>{name}</Typography>
            Displaying page {page} of {totalPages}
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={index - pageSize < 0}
              component={Link}
              to={`/forum/s/${id}${topQueryParams}`}
            >
              <FirstPageIcon />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={index - pageSize < 0}
              component={Link}
              to={`/forum/s/${id}${backwardQueryParams}`}
            >
              <ChevronLeft />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={index + pageSize > threadCount}
              component={Link}
              to={`/forum/s/${id}${forwardQueryParams}`}
            >
              <ChevronRight />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={index + pageSize > threadCount}
              component={Link}
              to={`/forum/s/${id}${bottomQueryParams}`}
            >
              <LastPageIcon />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const ThreadListItem = ({
  thread
}: {
  thread: firebase.firestore.DocumentData
}) => {
  const queryParams = encodeQueryParams({
    index: 0,
    name: thread.data().Head,
    limit: pageSize,
    replyCount: thread.data().DescendentCount,
    time: new firebase.firestore.Timestamp(0, 0),
    direction: 'forward'
  })
  return (
    <Card style={{ margin: 10, backgroundColor: 'lightgreen' }}>
      <CardContent>
        <Grid container direction='row'>
          <Grid item xs={5}>
            <div>
              <Link to={`/forum/t/${thread.ref.id}${queryParams}`}>
                {thread.data().Head}
              </Link>
            </div>
            <div>
              {thread.data().Author.Name},
              {thread.data().CreateTime.toDate().toLocaleString()}
            </div>
          </Grid>
          <Grid item xs={1}>
            {thread.data().ViewCount}
          </Grid>
          <Grid item xs={1}>
            {thread.data().DescendentCount}
          </Grid>
          <Grid item xs={5} />
        </Grid>
      </CardContent>
    </Card>
  )
}
const pageSize = 10

const useThreadPage = (
  id: string,
  time: firebase.firestore.Timestamp,
  direction: 'forward' | 'backward',
  limit: number
): [DocumentData[] | undefined, boolean, Error | undefined] => {
  const query = firebase
    .firestore()
    .collection('Posts')
    .where('Path', 'array-contains', id)
    .orderBy('CreateTime', direction == 'forward' ? 'asc' : 'desc')
    .startAfter(time)
    .limit(limit)
  const [response, loading, error] = useCollection(query)
  if (error) {
    return [undefined, loading, error]
  } else if (loading) {
    return [undefined, loading, error]
  } else if (response) {
    return [
      direction === 'forward' ? response.docs : [...response.docs].reverse(),
      loading,
      error
    ]
  } else {
    throw new Error()
  }
}

const Thread = () => {
  const { thread } = useParams()
  const { index, name, limit, replyCount, time, direction } = useQueryParams()
  const [docs, loading, error] = useThreadPage(thread, time, direction, limit)

  if (error) {
    return <div>{error.message}</div>
  } else if (loading) {
    return <div>Loading...</div>
  } else if (docs) {
    return (
      <div>
        <ThreadHeader
          id={thread}
          name={name}
          index={index}
          replyCount={replyCount}
          topTime={docs[0].data().CreateTime}
          bottomTime={docs[docs.length - 1].data().CreateTime}
        />
        {docs.map((item) => (
          <Reply key={item.ref.id} reply={item.data() as Post} />
        ))}
      </div>
    )
  }
  return <div>What???</div>
}

type ThreadHeaderProps = {
  id: string
  name: string
  index: number
  replyCount: number
  topTime: firebase.firestore.Timestamp
  bottomTime: firebase.firestore.Timestamp
}

const ThreadHeader = ({
  id,
  name,
  index,
  replyCount,
  topTime,
  bottomTime
}: ThreadHeaderProps) => {
  console.log('name: ', name)
  const page = Math.floor(index / pageSize) + 1
  const totalPages = Math.floor(replyCount / pageSize) + 1
  const topQueryParams = encodeQueryParams({
    id: id,
    name: name,
    index: 0,
    limit: pageSize,
    replyCount: replyCount,
    time: new firebase.firestore.Timestamp(0, 0),
    direction: 'forward'
  })
  const forwardQueryParams = encodeQueryParams({
    id: id,
    name: name,
    index: index + pageSize,
    limit: pageSize,
    replyCount: replyCount,
    time: bottomTime,
    direction: 'forward'
  })
  const backwardQueryParams = encodeQueryParams({
    id: id,
    name: name,
    index: index - pageSize,
    limit: pageSize,
    replyCount: replyCount,
    time: topTime,
    direction: 'backward'
  })
  const bottomQueryParams = encodeQueryParams({
    id: id,
    name: name,
    index: replyCount - (replyCount % pageSize),
    limit: replyCount % pageSize,
    replyCount: replyCount,
    time: firebase.firestore.Timestamp.now(),
    direction: 'backward'
  })

  return (
    <Card style={{ backgroundColor: 'lightgreen', margin: 10 }}>
      <CardContent>
        <Grid container justify='space-between'>
          <Grid item xs={8}>
            <Typography variant='h6'>{name}</Typography>
            Displaying page {page} of {totalPages}
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={page === 1}
              component={Link}
              to={topQueryParams}
            >
              <FirstPageIcon />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={page === 1}
              component={Link}
              to={backwardQueryParams}
            >
              <ChevronLeft />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={page === totalPages}
              component={Link}
              to={forwardQueryParams}
            >
              <ChevronRight />
            </IconButton>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              disabled={page === totalPages}
              component={Link}
              to={bottomQueryParams}
            >
              <LastPageIcon />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const Reply = ({ reply }: { reply: Post }) => {
  return (
    <Card style={{ margin: 10, backgroundColor: 'lightgrey' }}>
      <CardContent>
        <ReplyHeader reply={reply} />
        <Divider />
        <ReplyBody reply={reply} />
      </CardContent>
    </Card>
  )
}

const ReplyHeader = ({ reply }: { reply: Post }) => {
  return (
    <Grid container direction='row'>
      <Grid item xs={6}>
        <div>
          <Typography variant='h6'>{reply.Head}</Typography>
        </div>
        <div>
          <Typography variant='body2'>
            by {reply.AuthorDisplayName}, posted{' '}
            {reply.CreateTime.toDate().toLocaleString()}{' '}
            {reply.CreateTime.toDate().getMilliseconds()}
          </Typography>
        </div>
      </Grid>
      <Grid item xs={1}>
        {reply.ViewCount}
      </Grid>
      <Grid item xs={1}>
        {reply.ChildCount}
      </Grid>
    </Grid>
  )
}

const ReplyBody = ({ reply }: { reply: Post }) => {
  return <Typography variant='body1'>{reply.Body}</Typography>
}
